
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, getDocs, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { auth, db } from '@/lib/firebase';
import type { UserProfile, Address } from '@/lib/types';
import { MOCK_ADMIN_USER } from '@/lib/data';
import { useBlock } from './BlockContext';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  fetchAllUsers: () => Promise<UserProfile[]>;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, pass: string, phone: string, address: Address, isVerified: boolean, role: 'regular' | 'creator') => Promise<void>;
  addUser: (userData: Omit<UserProfile, 'id' | 'avatar' | 'tickets' | 'createdAt' | 'isVerified' | 'mustChangePassword'> & { password: string }) => Promise<void>;
  editUser: (userId: string, userData: Partial<Omit<UserProfile, 'id'>>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  isEmailBlocked: (email: string) => boolean;
  forcePasswordChange: (userId: string, newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockedEmails, setBlockedEmails] = useState<string[]>([]);
  const [isAdminSession, setIsAdminSession] = useState(false);

  // Fetch blocked users directly here to avoid context dependency issues
  useEffect(() => {
    const q = query(collection(db, "blockedUsers"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const emails = querySnapshot.docs.map(doc => doc.data().email as string);
        setBlockedEmails(emails);
    }, (error) => {
        // This might fail for non-admins, which is fine. They won't have any blocked emails.
        console.warn("Could not fetch blocked users list. This is expected for non-admins.", error.message);
        setBlockedEmails([]);
    });
    return () => unsubscribe();
  }, []);

  const fetchAllUsers = useCallback(async (): Promise<UserProfile[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        const usersList = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            return { 
                id: doc.id, 
                ...data,
                createdAt: createdAt
            } as UserProfile
        });
        return usersList;
    } catch (error) {
        console.error("Error fetching users: ", error);
        return [];
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (isAdminSession) {
          setLoading(false);
          return;
      }
      
      setFirebaseUser(user);
      if (user) {
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const createdAt = userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date();
          const userProfile = { 
              id: user.uid, 
              ...userData,
              createdAt: createdAt
          } as UserProfile;
          setCurrentUser(userProfile);
        } else {
           setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [isAdminSession]);

  const isEmailBlocked = (email: string) => {
    return blockedEmails.includes(email);
  }

  const login = async (email: string, pass: string): Promise<UserProfile | null> => {
    if(isEmailBlocked(email)) {
      throw new Error("Este email ha sido bloqueado.");
    }
    
    // Admin login check
    if (email === MOCK_ADMIN_USER.email && pass === MOCK_ADMIN_USER.password) {
      setIsAdminSession(true);
      setCurrentUser(MOCK_ADMIN_USER);
      setFirebaseUser(null); 
      return MOCK_ADMIN_USER;
    }
    
    try {
        setIsAdminSession(false);
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const userDocRef = doc(db, "usuarios", userCredential.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
             const userData = userDocSnap.data();
             const createdAt = userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date();
             const userProfile = { 
                 id: userCredential.user.uid, 
                 ...userData,
                 createdAt: createdAt
             } as UserProfile;
             setCurrentUser(userProfile);
             return userProfile;
        }
        return null;
    } catch (firebaseError) {
        const q = query(collection(db, "usuarios"), where("email", "==", email), where("password", "==", pass));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
             const createdAt = userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date();
            const localUser = { 
                id: userDoc.id, 
                ...userData,
                createdAt: createdAt
            } as UserProfile;
            
            setIsAdminSession(false); 
            setCurrentUser(localUser);
            setFirebaseUser(null);
            return localUser;
        }

        console.error("Login failed:", firebaseError);
        throw firebaseError;
    }
  };

  const logout = async () => {
    if (isAdminSession) {
      setIsAdminSession(false);
    }
    await signOut(auth).catch(() => {});
    setCurrentUser(null);
    setFirebaseUser(null);
  };
  
  const signup = async (name: string, email: string, pass:string, phone: string, address: Address, isVerified: boolean, role: 'regular' | 'creator') => {
    if (isEmailBlocked(email)) {
      throw new Error("Este email ha sido bloqueado y no puede ser usado para registrar una cuenta.");
    }
    
    try {
        setIsAdminSession(false);
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
        
    } catch (error) {
        console.error("Error during signup: ", error);
        throw error;
    }
  };

  const addUser = async (userData: Omit<UserProfile, 'id' | 'avatar' | 'tickets' | 'createdAt' | 'isVerified' | 'mustChangePassword'> & { password: string }) => {
     if (isEmailBlocked(userData.email)) {
      throw new Error("Este email ha sido bloqueado y no puede ser registrado.");
    }
    
    const q = query(collection(db, "usuarios"), where("email", "==", userData.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error("Este email ya está registrado.");
    }
    
    try {
        const { password, ...restOfData } = userData;
        const newUserProfileData = {
          ...restOfData,
          password,
          isVerified: false,
          avatar: `https://placehold.co/100x100.png?text=${userData.name.charAt(0)}`,
          tickets: [],
          mustChangePassword: true,
        };

        await addDoc(collection(db, "usuarios"), {
            ...newUserProfileData,
            createdAt: serverTimestamp()
        });
        
    } catch (error) {
        console.error("Error al crear usuario en Firestore:", error);
        throw new Error('No se pudo crear el usuario en Firestore.');
    }
  }
  
  const editUser = async (userId: string, userData: Partial<Omit<UserProfile, 'id'>>) => {
    const userDocRef = doc(db, "usuarios", userId);
    await updateDoc(userDocRef, userData);
    
    if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...userData } as UserProfile : null);
    }
  };

  const forcePasswordChange = async (userId: string, newPass: string) => {
      await editUser(userId, { password: newPass, mustChangePassword: false });
  }

  const deleteUser = async (userId: string) => {
    await deleteDoc(doc(db, "usuarios", userId));
  }

  return (
    <AuthContext.Provider value={{ user: currentUser, firebaseUser, fetchAllUsers, isAuthenticated: !!currentUser, loading, login, logout, signup, addUser, editUser, deleteUser, isEmailBlocked, forcePasswordChange }}>
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
