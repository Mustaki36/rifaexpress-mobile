
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User as FirebaseUser,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, deleteDoc, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from '@/lib/firebase';
import type { UserProfile, Address } from '@/lib/types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, pass: string, phone: string, address: Address, isVerified: boolean, role: 'regular' | 'creator') => Promise<void>;
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
      if (user) {
        const userDocRef = doc(db, "usuarios", user.uid);
        const claims = (await user.getIdTokenResult()).claims;
        const userRole = claims.role || 'regular'; // Default to regular if no role claim

        const unsubUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.role === 'suspended' || userRole === 'suspended') {
                  setCurrentUser(null);
                  setFirebaseUser(null);
                  signOut(auth);
                } else {
                  const createdAt = userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date();
                  const userProfile = { 
                      id: user.uid, 
                      ...userData,
                      role: userRole,
                      createdAt: createdAt
                  } as UserProfile;
                  setCurrentUser(userProfile);
                  setFirebaseUser(user);
                }
            } else {
               setCurrentUser(null);
               setFirebaseUser(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setCurrentUser(null);
            setFirebaseUser(null);
            setLoading(false);
        });
        return () => unsubUser();
      } else {
        setCurrentUser(null);
        setFirebaseUser(null);
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<UserProfile | null> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    const userDocRef = doc(db, "usuarios", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const claims = (await user.getIdTokenResult()).claims;
    const userRole = claims.role || 'regular';

    if (userDocSnap.exists()) {
         const userData = userDocSnap.data();
         if(userData.role === 'suspended' || userRole === 'suspended') {
            await signOut(auth);
            throw new Error("This account is suspended.");
         }
         const createdAt = userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date();
         const userProfile = { 
             id: userCredential.user.uid, 
             ...userData,
             role: userRole,
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
    // Note: Creating users via signup won't have custom claims until an admin sets them.
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    const newUserProfileData = {
       name,
       email,
       phone,
       address,
       isVerified,
       role, // This will be the initial role in Firestore, but claims are the source of truth
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
  
  const editUser = async (userId: string, userData: Partial<Omit<UserProfile, 'id'>>) => {
      const userDocRef = doc(db, "usuarios", userId);
      await updateDoc(userDocRef, userData);
  };
  
  const deleteUser = async (userId: string) => {
    const userDocRef = doc(db, "usuarios", userId);
    await deleteDoc(userDocRef);
    // Note: This does not delete the user from Firebase Auth to prevent accidental irreversible deletion.
    // That should be done via the Firebase Console or a more specific admin action.
  };
  
  const suspendUser = async (userId: string) => {
      const userDocRef = doc(db, "usuarios", userId);
      await updateDoc(userDocRef, { role: 'suspended' });
      // In a real app with Admin SDK, you'd also call `admin.auth().setCustomUserClaims(userId, { role: 'suspended' });`
      // and potentially `admin.auth().revokeRefreshTokens(userId);` from a backend.
  };
  
  const forcePasswordChange = async (userId: string, newPass: string) => {
      // This is a client-side simulation. A real implementation should use Admin SDK to trigger a password reset email.
      const userDocRef = doc(db, "usuarios", userId);
      await updateDoc(userDocRef, {
        mustChangePassword: false,
      });
  };

  return (
    <AuthContext.Provider value={{ user: currentUser, firebaseUser, isAuthenticated: !!currentUser && !!firebaseUser, loading, login, logout, signup, editUser, deleteUser, forcePasswordChange, suspendUser }}>
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
