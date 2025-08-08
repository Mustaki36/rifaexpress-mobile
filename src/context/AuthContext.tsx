
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, addDoc, deleteDoc, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { auth, db } from '@/lib/firebase';
import type { UserProfile, Address } from '@/lib/types';
import { useBlock } from './BlockContext';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, pass: string, phone: string, address: Address, isVerified: boolean, role: 'regular' | 'creator') => Promise<void>;
  addUser: (userData: Omit<UserProfile, 'id' | 'avatar' | 'tickets' | 'createdAt' | 'isVerified' | 'mustChangePassword' | 'role'> & { password: string, role: 'regular' | 'creator' }) => Promise<void>;
  editUser: (userId: string, userData: Partial<Omit<UserProfile, 'id'>>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  suspendUser: (userId: string) => Promise<void>;
  forcePasswordChange: (userId: string, newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setFirebaseUser(user);
      if (user) {
        const userDocRef = doc(db, "usuarios", user.uid);
        const unsubUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.role === 'suspended') {
                  setCurrentUser(null);
                  signOut(auth); // Log out suspended user
                } else {
                  const createdAt = userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date();
                  const userProfile = { 
                      id: user.uid, 
                      ...userData,
                      createdAt: createdAt
                  } as UserProfile;
                  setCurrentUser(userProfile);
                }
            } else {
               setCurrentUser(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setCurrentUser(null);
            setLoading(false);
        });
        return () => unsubUser();
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<UserProfile | null> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const userDocRef = doc(db, "usuarios", userCredential.user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
         const userData = userDocSnap.data();
         if(userData.role === 'suspended') {
            await signOut(auth);
            throw new Error("This account is suspended.");
         }
         const createdAt = userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date();
         const userProfile = { 
             id: userCredential.user.uid, 
             ...userData,
             createdAt: createdAt
         } as UserProfile;
         return userProfile;
    }
    return null;
  };

  const logout = async () => {
    await signOut(auth);
  };
  
  const signup = async (name: string, email: string, pass:string, phone: string, address: Address, isVerified: boolean, role: 'regular' | 'creator') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    const newUserProfileData = {
       name,
       email,
       phone,
       address,
       isVerified,
       role,
       avatar: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
       tickets: [],
       mustChangePassword: false,
    };

    const userDocRef = doc(db, "usuarios", user.uid);
    await setDoc(userDocRef, {
        ...newUserProfileData,
        createdAt: serverTimestamp(),
    });
  };
  
  const addUser = async (userData: Omit<UserProfile, 'id' | 'avatar' | 'tickets' | 'createdAt' | 'isVerified' | 'mustChangePassword' | 'role'> & { password: string, role: 'regular' | 'creator' }) => {
    console.warn("addUser is using a client-side method that is not secure for production.");
    
    const q = query(collection(db, "usuarios"), where("email", "==", userData.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error("Este email ya está registrado.");
    }
    
    const { password, ...restOfData } = userData;
    const newUserProfileData = {
      ...restOfData,
      isVerified: false,
      avatar: `https://placehold.co/100x100.png?text=${userData.name.charAt(0)}`,
      tickets: [],
      mustChangePassword: true,
    };

    await addDoc(collection(db, "usuarios"), {
        ...newUserProfileData,
        createdAt: serverTimestamp()
    });
  }
  
  const editUser = async (userId: string, userData: Partial<Omit<UserProfile, 'id'>>) => {
    const userDocRef = doc(db, "usuarios", userId);
    await updateDoc(userDocRef, userData);
  };

  const forcePasswordChange = async (userId: string, newPass: string) => {
      await editUser(userId, { password: newPass, mustChangePassword: false });
  }

  const deleteUser = async (userId: string) => {
    if (user?.role !== 'admin') {
      throw new Error("Only admins can delete users.");
    }
    // This only deletes the Firestore document.
    // The Firebase Auth user still exists. For full deletion, a Cloud Function is required.
    const userDocRef = doc(db, "usuarios", userId);
    await deleteDoc(userDocRef);
  }

  const suspendUser = async (userId: string) => {
    const userDocRef = doc(db, "usuarios", userId);
    await updateDoc(userDocRef, { role: 'suspended' });
  };


  return (
    <AuthContext.Provider value={{ user: currentUser, firebaseUser, isAuthenticated: !!currentUser && !!firebaseUser, loading, login, logout, signup, addUser, editUser, deleteUser, forcePasswordChange, suspendUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
