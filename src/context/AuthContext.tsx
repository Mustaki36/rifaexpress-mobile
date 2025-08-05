
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from '@/lib/firebase';
import type { UserProfile, Address } from '@/lib/types';
import { MOCK_ADMIN_USER } from '@/lib/data'; // We'll keep this for now for the admin role
import { useBlock } from './BlockContext';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  allUsers: UserProfile[]; // This will now also be fetched from Firestore
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, pass: string, phone: string, address: Address, isVerified: boolean, role: 'regular' | 'creator') => Promise<void>;
  addUser: (userData: Omit<UserProfile, 'id' | 'avatar' | 'tickets' | 'createdAt' | 'isVerified'> & {isVerified?: boolean}) => Promise<void>;
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
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Handle mock admin login separately
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
        setCurrentUser(MOCK_ADMIN_USER);
        return MOCK_ADMIN_USER;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const userDocRef = doc(db, "users", userCredential.user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = { id: userCredential.user.uid, ...userDocSnap.data() } as UserProfile;
        setCurrentUser(userData);
        return userData;
    }

    return null;
  };

  const logout = async () => {
    // If admin is logging out, just clear state without signing out of firebase
    if (currentUser?.role === 'admin') {
      setCurrentUser(null);
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
       password,
       mustChangePassword: false,
    };

    await setDoc(doc(db, "users", user.uid), {
        ...newUserProfile,
        createdAt: serverTimestamp(),
    });
    
    await fetchAllUsers();
  };

  const addUser = async (userData: Omit<UserProfile, 'id' | 'avatar' | 'tickets' | 'createdAt' | 'isVerified'> & {isVerified?: boolean}) => {
     if (isEmailBlocked(userData.email)) {
      throw new Error("Este email ha sido bloqueado y no puede ser registrado.");
    }

    // In a real app, this would be a secure backend Cloud Function.
    // For this simulation, we are temporarily creating a new user on the client, which is insecure.
    // We create the user, but we don't sign them in. The admin remains logged in.
    try {
        const newUserProfileData = {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          role: userData.role,
          isVerified: userData.isVerified || false,
          avatar: `https://placehold.co/100x100.png?text=${userData.name.charAt(0)}`,
          tickets: [],
          mustChangePassword: true,
          password: userData.password, // This is for local logic, not a secure practice.
          createdAt: serverTimestamp(),
        };

        // Add to the 'users' collection with an auto-generated ID
        const newUserDocRef = await addDoc(collection(db, "users"), newUserProfileData);
        
        // This is a placeholder for creating the user in Firebase Auth
        // In a real app, you would use a Cloud Function that calls the Admin SDK:
        // admin.auth().createUser({ email: userData.email, password: userData.password });
        console.warn(`Simulating Auth creation for ${userData.email}. In production, use a Cloud Function.`);
        
        await fetchAllUsers();

    } catch (error) {
        console.error("Error creating user:", error);
        if (error instanceof Error && error.message.includes('auth/email-already-in-use')) {
            throw new Error('Este email ya está en uso.');
        }
        throw new Error('No se pudo crear el usuario en Firestore.');
    }
  }
  
  const editUser = async (userId: string, userData: Partial<Omit<UserProfile, 'id'>>) => {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, userData);
    
    if (currentUser?.id === userId) {
        const updatedUserDoc = await getDoc(userDocRef);
        if (updatedUserDoc.exists()) {
            const data = updatedUserDoc.data();
            setCurrentUser({ 
                id: userId, 
                ...data,
                createdAt: data.createdAt?.toDate()
            } as UserProfile);
        }
    }
    await fetchAllUsers();
  };

  const forcePasswordChange = async (userId: string, newPass: string) => {
      console.warn("Password change is mocked. In a real app, use Firebase Auth's updatePassword.");
      await editUser(userId, { password: newPass, mustChangePassword: false });
  }

  const deleteUser = async (userId: string) => {
    console.warn("deleteUser only removes the Firestore document, not the Auth user.");
    await deleteDoc(doc(db, "users", userId));
    await fetchAllUsers();
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
