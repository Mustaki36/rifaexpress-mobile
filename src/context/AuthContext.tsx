
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, onSnapshot } from "firebase/firestore";
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
        // Force refresh the token to get the latest custom claims.
        await user.getIdToken(true); 
        const userDocRef = doc(db, "usuarios", user.uid);
        
        const unsubUser = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                
                // Get the role from custom claims as the primary source of truth for permissions.
                const tokenResult = await user.getIdTokenResult();
                const claims = tokenResult.claims;
                const userRole = claims.role || userData.role || 'regular';

                if (userRole === 'suspended') {
                  setCurrentUser(null);
                  setFirebaseUser(null);
                  signOut(auth);
                } else {
                  const userProfile = { 
                      id: user.uid, 
                      email: user.email!,
                      ...userData,
                      role: userRole, // Use the role from claims/userData
                      createdAt: (userData.createdAt as any)?.toDate ? (userData.createdAt as any).toDate() : new Date(),
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

    // Force token refresh on login to get latest claims.
    const tokenResult = await user.getIdTokenResult(true);
    const claims = tokenResult.claims;
    const userRole = claims.role || 'regular';

    if (userRole === 'suspended') {
      await signOut(auth);
      throw new Error("This account is suspended.");
    }

    const userDocRef = doc(db, "usuarios", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
         const userData = userDocSnap.data();
         if(userData.role === 'suspended') {
            await signOut(auth);
            throw new Error("This account is suspended.");
         }
         const userProfile = { 
             id: userCredential.user.uid,
             email: userCredential.user.email!, 
             ...userData,
             role: userRole, // Ensure role from claims is used
             createdAt: (userData.createdAt as any)?.toDate ? (userData.createdAt as any).toDate() : new Date(),
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
  
  const forcePasswordChange = async (userId: string, newPass: string) => {
      // This simulation is only for the UI. The actual password change is initiated by the admin.
      const userDocRef = doc(db, "usuarios", userId);
      await updateDoc(userDocRef, {
        mustChangePassword: false,
      });
  };

  return (
    <AuthContext.Provider value={{ user: currentUser, firebaseUser, isAuthenticated: !!currentUser && !!firebaseUser, loading, login, logout, signup, forcePasswordChange }}>
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
