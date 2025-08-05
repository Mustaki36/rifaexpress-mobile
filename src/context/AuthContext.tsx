
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
  allUsers: UserProfile[];
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
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { blockedUsers } = useBlock();

  const fetchAllUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt?.toDate() // Convert timestamp to Date
            } as UserProfile
        });
        setAllUsers(usersList);
    } catch (error) {
        console.error("Error fetching users: ", error);
    }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        if (user.email === MOCK_ADMIN_USER.email) {
            setCurrentUser(MOCK_ADMIN_USER);
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({ 
              id: user.uid, 
              ...userData,
              createdAt: userData.createdAt?.toDate()
          } as UserProfile);
        } else {
           setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    fetchAllUsers();
    
    return () => unsubscribe();
  }, []);



  const isEmailBlocked = (email: string) => {
    return blockedUsers.some(u => u.email === email);
  }

  const login = async (email: string, pass: string): Promise<UserProfile | null> => {
    if(isEmailBlocked(email)) {
      throw new Error("Este email ha sido bloqueado.");
    }
    
    if (email === MOCK_ADMIN_USER.email && pass === MOCK_ADMIN_USER.password) {
      setFirebaseUser({ email: MOCK_ADMIN_USER.email } as FirebaseUser);
      setCurrentUser(MOCK_ADMIN_USER);
      return MOCK_ADMIN_USER;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const userDocRef = doc(db, "users", userCredential.user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userProfile = { id: userCredential.user.uid, ...userData } as UserProfile;
        
        if (userData.password !== pass) {
            throw new Error("auth/invalid-credential");
        }

        setCurrentUser(userProfile);
        return userProfile;
    }

    return null;
  };

  const logout = async () => {
    if (currentUser?.role === 'admin') {
      setCurrentUser(null);
      setFirebaseUser(null);
    } else {
      await signOut(auth);
    }
  };
  
  const signup = async (name: string, email: string, pass: string, phone: string, address: Address, isVerified: boolean, role: 'regular' | 'creator') => {
    if (isEmailBlocked(email)) {
      throw new Error("Este email ha sido bloqueado.");
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    const newUserProfile: Omit<UserProfile, 'id' | 'createdAt'> = {
       name,
       email,
       phone,
       address,
       isVerified,
       role,
       avatar: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
       tickets: [],
       password: pass, 
       mustChangePassword: false,
    };

    await setDoc(doc(db, "users", user.uid), {
        ...newUserProfile,
        createdAt: serverTimestamp(),
    });
    
    await fetchAllUsers();
  };

  const addUser = async (userData: Omit<UserProfile, 'id' | 'avatar' | 'tickets' | 'createdAt' | 'isVerified' | 'mustChangePassword'> & { password: string }) => {
     if (isEmailBlocked(userData.email)) {
      throw new Error("Este email ha sido bloqueado y no puede ser registrado.");
    }
    
    const q = query(collection(db, "users"), where("email", "==", userData.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error("Este email ya está registrado.");
    }
    
    console.warn(`IMPORTANTE: Este flujo crea un registro de usuario en Firestore pero NO en Firebase Auth. Para un inicio de sesión real, el usuario necesitaría registrarse a través del flujo normal o un administrador necesitaría usar una función de backend para crear una cuenta de autenticación.`);

    try {
        const newUserProfileData = {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          role: userData.role,
          isVerified: false,
          avatar: `https://placehold.co/100x100.png?text=${userData.name.charAt(0)}`,
          tickets: [],
          mustChangePassword: true,
          password: userData.password,
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "users"), newUserProfileData);
        setAllUsers(prevUsers => [...prevUsers, { id: docRef.id, ...newUserProfileData, createdAt: new Date() } as UserProfile]);

    } catch (error) {
        console.error("Error al crear usuario en Firestore:", error);
        throw new Error('No se pudo crear el usuario en Firestore.');
    }
  }
  
  const editUser = async (userId: string, userData: Partial<Omit<UserProfile, 'id'>>) => {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, userData);
    
    setAllUsers(prevUsers => prevUsers.map(user => user.id === userId ? { ...user, ...userData } : user));

    if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...userData } : null);
    }
  };

  const forcePasswordChange = async (userId: string, newPass: string) => {
      await editUser(userId, { password: newPass, mustChangePassword: false });
  }

  const deleteUser = async (userId: string) => {
    console.warn(`Eliminando usuario ${userId} solo de Firestore. El usuario de Auth todavía puede existir.`);
    await deleteDoc(doc(db, "users", userId));
    setAllUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  }


  return (
    <AuthContext.Provider value={{ user: currentUser, firebaseUser, allUsers, isAuthenticated: !!currentUser, loading, login, logout, signup, addUser, editUser, deleteUser, isEmailBlocked, forcePasswordChange }}>
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
