
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
  // Verification logic will be simplified or moved server-side in a real app
  isEmailBlocked: (email: string) => boolean;
  forcePasswordChange: (userId: string, newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { blockedUsers } = useBlock(); // We'll keep using the mock block context for now

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
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({ 
              id: user.uid, 
              ...userData,
              createdAt: userData.createdAt?.toDate() // Convert timestamp to Date
          } as UserProfile);
        } else {
           // Handle case where user exists in Auth but not in Firestore
           // This might happen if Firestore data is deleted manually.
           // For now, we'll just log them out.
           setCurrentUser(null);
        }
      } else {
        // User is signed out
        setCurrentUser(null);
      }
      setLoading(false);
    });

    fetchAllUsers();
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);



  const isEmailBlocked = (email: string) => {
    return blockedUsers.some(u => u.email === email);
  }

  const login = async (email: string, pass: string): Promise<UserProfile | null> => {
    if(isEmailBlocked(email)) {
      throw new Error("Este email ha sido bloqueado.");
    }
    
    // Handle mock admin login separately for now
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
    await signOut(auth);
    setCurrentUser(null);
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
       password, // Storing password for force change logic, NOT recommended for production without encryption
       mustChangePassword: false,
    };

    await setDoc(doc(db, "users", user.uid), {
        ...newUserProfile,
        createdAt: serverTimestamp(),
    });
    
    await fetchAllUsers(); // Refresh users list
  };

  const addUser = async (userData: Omit<UserProfile, 'id' | 'avatar' | 'tickets' | 'createdAt' | 'isVerified'> & {isVerified?: boolean}) => {
    if (isEmailBlocked(userData.email)) {
      throw new Error("Este email ha sido bloqueado y no puede ser registrado.");
    }
    
    // This function creates a user document in Firestore.
    // In a real app, you would also need a backend process (like a Cloud Function)
    // to create the corresponding Firebase Auth user to allow them to log in.
    const newUser: Omit<UserProfile, 'id' | 'createdAt'> = {
      ...userData,
      isVerified: userData.isVerified || false,
      avatar: `https://placehold.co/100x100.png?text=${userData.name.charAt(0)}`,
      tickets: [],
      mustChangePassword: true, // Force password change on first login
    };

    await addDoc(collection(db, "users"), {
        ...newUser,
        createdAt: serverTimestamp()
    });

    // Fetch all users again to get the updated list
    await fetchAllUsers();
  }
  
  const editUser = async (userId: string, userData: Partial<Omit<UserProfile, 'id'>>) => {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, userData);
    
    // Also update the currently logged-in user if they are the one being edited
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
      // Password changes must be done by the authenticated user.
      // This implementation is simplified. A real app would require re-authentication.
      if (auth.currentUser && auth.currentUser.uid === userId) {
          // This is a placeholder. The actual password update would be done with updatePassword from 'firebase/auth'.
          // For now, we just update the Firestore document.
          console.warn("Password change is mocked. In a real app, use Firebase Auth's updatePassword.");
          await editUser(userId, { password: newPass, mustChangePassword: false });
      } else {
          throw new Error("No tienes permiso para cambiar la contraseña de este usuario.");
      }
  }

  const deleteUser = async (userId: string) => {
    // Deleting a user should be a privileged, server-side operation.
    // For this simulation, we will delete the Firestore document.
    // NOTE: This does NOT delete the Firebase Auth user, which would require an admin SDK.
    console.warn("deleteUser only removes the Firestore document, not the Auth user.");
    await deleteDoc(db, "users", userId);
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
