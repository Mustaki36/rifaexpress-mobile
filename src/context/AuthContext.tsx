
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
        // Forzar el refresco del token asegura que los claims estén actualizados.
        await user.getIdToken(true); 
        const userDocRef = doc(db, "usuarios", user.uid);
        
        // Usamos onSnapshot para escuchar cambios en el perfil del usuario en tiempo real.
        const unsubUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                // El rol de Firestore es la fuente de verdad.
                // Si está suspendido, cerramos sesión.
                if (userData.role === 'suspended') {
                  setCurrentUser(null);
                  setFirebaseUser(null);
                  signOut(auth);
                } else {
                  // Combinamos los datos de Auth (uid, email) con los de Firestore.
                  const userProfile = { 
                      id: user.uid, 
                      email: user.email!,
                      ...userData,
                      // Convertimos el Timestamp de Firestore a un objeto Date de JS.
                      createdAt: (userData.createdAt as any)?.toDate ? (userData.createdAt as any).toDate() : new Date(),
                  } as UserProfile;
                  setCurrentUser(userProfile);
                  setFirebaseUser(user);
                }
            } else {
               // Si el documento de Firestore no existe, el usuario no está completamente configurado.
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

        // Limpiamos el listener de perfil cuando el estado de auth cambia.
        return () => unsubUser();
      } else {
        setCurrentUser(null);
        setFirebaseUser(null);
        setLoading(false);
      }
    });
    
    // Limpiamos el listener de auth cuando el componente se desmonta.
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<UserProfile | null> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
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
      // Esta simulación es solo para la interfaz. El cambio de contraseña real lo inicia el admin.
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
