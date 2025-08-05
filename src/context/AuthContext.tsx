
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, getDocs, addDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore";
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
  const [isAdminSession, setIsAdminSession] = useState(false);

  const fetchAllUsers = useCallback(async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt?.toDate() // Convertir timestamp a Date
            } as UserProfile
        });
        setAllUsers(usersList);
    } catch (error) {
        console.error("Error fetching users: ", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If we have an active admin session, don't let onAuthStateChanged override it
      if (isAdminSession) {
          setLoading(false);
          return;
      }
      
      setFirebaseUser(user);
      if (user) {
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
           // This case can happen if a user is in Firebase Auth but not in Firestore DB
           // Or during the brief moment of user creation.
           const localUser = allUsers.find(u => u.id === user.uid);
           if(localUser) {
               setCurrentUser(localUser);
           } else {
               setCurrentUser(null);
           }
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    fetchAllUsers();
    
    return () => unsubscribe();
  }, [fetchAllUsers, isAdminSession, allUsers]);

  const isEmailBlocked = (email: string) => {
    return blockedUsers.some(u => u.email === email);
  }

  const login = async (email: string, pass: string): Promise<UserProfile | null> => {
    if(isEmailBlocked(email)) {
      throw new Error("Este email ha sido bloqueado.");
    }
    
    if (email === MOCK_ADMIN_USER.email && pass === MOCK_ADMIN_USER.password) {
      setCurrentUser(MOCK_ADMIN_USER);
      setFirebaseUser(null); 
      setIsAdminSession(true); // Set the flag for admin session
      return MOCK_ADMIN_USER;
    }
    
    setIsAdminSession(false); // Reset admin flag on regular login attempt
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const userDocRef = doc(db, "users", userCredential.user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const userProfile = { 
                id: userCredential.user.uid, 
                ...userData,
                createdAt: userData.createdAt.toDate()
            } as UserProfile;
            setCurrentUser(userProfile);
            return userProfile;
        } else {
             // Fallback for admin-created users
            const localUser = allUsers.find(u => u.email === email && u.password === pass);
             if (localUser) {
                setCurrentUser(localUser);
                setFirebaseUser({ uid: localUser.id, email: localUser.email } as FirebaseUser);
                return localUser;
            }
             throw new Error("User profile not found in Firestore.");
        }
    } catch (error) {
        // Fallback for admin-created users not in Firebase Auth
        const localUser = allUsers.find(u => u.email === email && u.password === pass);
        if (localUser) {
            setCurrentUser(localUser);
            // Simulate a firebaseUser object for consistency. It won't have all methods.
            setFirebaseUser({ uid: localUser.id, email: localUser.email } as FirebaseUser);
            return localUser;
        }
        console.error("Firebase Auth login failed:", error);
        throw new Error("auth/invalid-credential");
    }
  };

  const logout = async () => {
    if (isAdminSession) {
      setIsAdminSession(false);
    }
    await signOut(auth).catch(() => {}); // Sign out real user if any
    setCurrentUser(null);
    setFirebaseUser(null);
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

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
        ...newUserProfile,
        createdAt: serverTimestamp(),
    });
    
    const newUserDoc = await getDoc(userDocRef);
    const newUserData = newUserDoc.data();
    const createdUser = {
        id: newUserDoc.id,
        ...newUserData,
        createdAt: newUserData?.createdAt.toDate(),
    } as UserProfile;

    setAllUsers(prev => [...prev, createdUser]);
    setCurrentUser(createdUser);
    setIsAdminSession(false);
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
    
    try {
        const newUserProfileData = {
          ...userData,
          isVerified: false,
          avatar: `https://placehold.co/100x100.png?text=${userData.name.charAt(0)}`,
          tickets: [],
          mustChangePassword: true,
        };

        const docRef = await addDoc(collection(db, "users"), {
            ...newUserProfileData,
            createdAt: serverTimestamp()
        });

        const finalUser = { 
            id: docRef.id, 
            ...newUserProfileData,
            createdAt: new Date() // Use local date for immediate feedback
        };

        setAllUsers(prevUsers => [...prevUsers, finalUser as UserProfile]);
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
