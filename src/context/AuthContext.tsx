
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User as FirebaseUser,
    signInWithCredential,
    EmailAuthProvider
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
    const adminUser = auth.currentUser;
    if (!adminUser || !adminUser.email) {
        throw new Error("Administrador no ha iniciado sesión o no tiene email.");
    }
    const adminEmail = adminUser.email;
    
    // IMPORTANT: This is a hacky workaround for client-side user creation by an admin.
    // The correct way is to use the Admin SDK in a Cloud Function.
    // This flow will sign out the admin and sign in the new user, then attempt to sign the admin back in.
    // It is not recommended for production environments.

    try {
        // Create the new user account
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const newUser = userCredential.user;
        
        // Prepare new user's profile data
        const newUserProfileData = {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          isVerified: false,
          avatar: `https://placehold.co/100x100.png?text=${userData.name.charAt(0)}`,
          tickets: [],
          mustChangePassword: true, // Force password change on first login
        };

        // Create the user profile document in Firestore
        await setDoc(doc(db, "usuarios", newUser.uid), {
            ...newUserProfileData,
            createdAt: serverTimestamp(),
        });
        
        // Sign out the newly created user
        await signOut(auth);
        
        // Prompt admin to sign back in
        const adminPassword = prompt("Usuario creado exitosamente. Por favor, re-ingresa la contraseña de administrador para continuar:");

        if (adminPassword) {
            await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        } else {
            throw new Error("Se requiere la contraseña de administrador para continuar la sesión.");
        }

    } catch (error: any) {
        console.error("Error adding user:", error);
        
        // Try to re-authenticate admin if something failed, as they might have been signed out
        if (!auth.currentUser) {
             const adminPassword = prompt("Ocurrió un error. Por favor, re-ingresa la contraseña de administrador para continuar:");
             if (adminPassword) {
                await signInWithEmailAndPassword(auth, adminEmail, adminPassword).catch(e => console.error("Admin re-login failed:", e));
             }
        }
        
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('Este correo electrónico ya está en uso. Por favor, utiliza otro.');
        }

        throw new Error("No se pudo crear el usuario. Revisa los datos y vuelve a intentarlo.");
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
    <AuthContext.Provider value={{ user: currentUser, firebaseUser, isAuthenticated: !!currentUser && !!firebaseUser, loading, login, logout, signup, addUser, editUser, deleteUser, forcePasswordChange, suspendUser }}>
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
