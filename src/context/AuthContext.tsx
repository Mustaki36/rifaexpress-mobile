
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
    // This function is intended to be called by an admin.
    // WARNING: The standard Firebase client-side SDK (`firebase/auth`) does not provide a direct way for an admin to create a new user without signing out the current admin.
    // The `createUserWithEmailAndPassword` function automatically signs in the new user.
    // The standard, secure way to implement this feature is with a server-side environment (like Cloud Functions) using the Firebase Admin SDK.
    // The following implementation is a workaround and will result in the admin being temporarily signed out. This is not ideal for production environments.
    
    const adminUser = auth.currentUser;
    if (!adminUser) {
        throw new Error("Admin not signed in.");
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const newUser = userCredential.user;
        
        const newUserProfileData = {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          isVerified: false,
          avatar: `https://placehold.co/100x100.png?text=${userData.name.charAt(0)}`,
          tickets: [],
          mustChangePassword: true,
        };

        await setDoc(doc(db, "usuarios", newUser.uid), {
            ...newUserProfileData,
            createdAt: serverTimestamp(),
        });
        
        // After creating the new user, the admin is signed out and the new user is signed in.
        // We now sign the new user out. The admin will have to log in again.
        await signOut(auth);
        alert("Usuario creado exitosamente. El administrador debe iniciar sesión de nuevo.");


    } catch (error) {
        // If user creation fails, the admin should still be logged in.
        // We need to handle re-authentication of the admin if something went wrong after they were logged out.
        // For this prototype, we'll log the error and rely on the admin to log back in manually.
        console.error("Error adding user:", error);
        throw error;
    }
  };
  
  const editUser = async (userId: string, userData: Partial<Omit<UserProfile, 'id'>>) => {
      const userDocRef = doc(db, "usuarios", userId);
      await updateDoc(userDocRef, userData);
  };
  
  const deleteUser = async (userId: string) => {
    // Note: This only deletes the Firestore document, not the Firebase Auth user.
    // Deleting the Auth user requires the Admin SDK (e.g., in a Cloud Function).
    const userDocRef = doc(db, "usuarios", userId);
    await deleteDoc(userDocRef);
  };
  
  const suspendUser = async (userId: string) => {
      const userDocRef = doc(db, "usuarios", userId);
      await updateDoc(userDocRef, { role: 'suspended' });
  };
  
  const forcePasswordChange = async (userId: string, newPass: string) => {
      // In a real app, this would be a secure server-side operation.
      // This is a mock implementation.
      const userDocRef = doc(db, "usuarios", userId);
      await updateDoc(userDocRef, {
        mustChangePassword: false,
        // In a real app, you would not store the password here.
      });
  };

  return (
    <AuthContext.Provider value={{ user: currentUser, firebaseUser, isAuthenticated: !!currentUser && !!firebaseUser, loading, login, logout, signup, addUser, editUser, deleteUser, suspendUser, forcePasswordChange }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
