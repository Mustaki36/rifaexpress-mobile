

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
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            return { 
                id: doc.id, 
                ...data,
                createdAt: createdAt
            } as UserProfile
        });
        setAllUsers(usersList);
    } catch (error) {
        console.error("Error fetching users: ", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
          const createdAt = userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date();
          const userProfile = { 
              id: user.uid, 
              ...userData,
              createdAt: createdAt
          } as UserProfile;
          setCurrentUser(userProfile);
          // Also update the allUsers state if this user is somehow not there
           setAllUsers(prev => {
                const userExists = prev.some(u => u.id === user.uid);
                if (!userExists) {
                    return [...prev, userProfile];
                }
                return prev.map(u => u.id === user.uid ? userProfile : u);
           });
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
  }, [fetchAllUsers, isAdminSession]);

  const isEmailBlocked = (email: string) => {
    return blockedUsers.some(u => u.email === email);
  }

  const login = async (email: string, pass: string): Promise<UserProfile | null> => {
    if(isEmailBlocked(email)) {
      throw new Error("Este email ha sido bloqueado.");
    }
    
    // Prioritize admin login check
    if (email === MOCK_ADMIN_USER.email && pass === MOCK_ADMIN_USER.password) {
      setCurrentUser(MOCK_ADMIN_USER);
      setFirebaseUser(null); 
      setIsAdminSession(true);
      return MOCK_ADMIN_USER;
    }
    
    setIsAdminSession(false); 
    
    // Then, try Firebase Auth
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const userDocRef = doc(db, "users", userCredential.user.uid);
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
        } else {
             // This case is unlikely if signup is working correctly, but good to have
             await signOut(auth);
             throw new Error("User profile not found in Firestore.");
        }
    } catch (firebaseError) {
        // Fallback for admin-created users without a Firebase Auth account
        const q = query(collection(db, "users"), where("email", "==", email), where("password", "==", pass));
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

            if (localUser) {
              setCurrentUser(localUser);
              setFirebaseUser(null); // No real Firebase auth session
              return localUser;
            }
        }
        
        console.error("Login failed:", firebaseError);
        throw firebaseError; // Re-throw original Firebase error if local user not found
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
  
  const signup = async (name: string, email: string, pass:string, phone: string, address: Address, isVerified: boolean, role: 'regular' | 'creator') => {
    if (isEmailBlocked(email)) {
      throw new Error("Este email ha sido bloqueado y no puede ser usado para registrar una cuenta.");
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        
        // For Firebase Auth users, we DO NOT store the password in Firestore.
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
    
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
            ...newUserProfileData,
            createdAt: serverTimestamp(),
        });
        
        const finalUser = {
            id: user.uid,
            ...newUserProfileData,
            createdAt: new Date(),
        } as UserProfile;
        
        setCurrentUser(finalUser);
        setAllUsers(prev => [...prev, finalUser]);
        
        // This is a new user, so their session is not an admin session.
        setIsAdminSession(false);

    } catch (error) {
        // Re-throw the error so it can be caught in the UI component
        console.error("Error during signup: ", error);
        throw error;
    }
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
        // We are creating a local user, so we store the password.
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
    
    setAllUsers(prevUsers => prevUsers.map(user => user.id === userId ? { ...user, ...userData } as UserProfile : user));

    if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...userData } as UserProfile : null);
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

    
    