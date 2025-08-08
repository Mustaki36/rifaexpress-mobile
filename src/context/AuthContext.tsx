
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, getDocs, addDoc, deleteDoc, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from '@/lib/firebase';
import type { UserProfile, Address } from '@/lib/types';
import { MOCK_ADMIN_USER } from '@/lib/data';

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
  forcePasswordChange: (userId: string, newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminSession, setIsAdminSession] = useState(false);
  
  const fetchAllUsers = useCallback(async (): Promise<UserProfile[]> => {
    // This function is now intended to be called only by an authenticated admin.
    // The security rules should enforce this.
    try {
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        const usersList = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date());
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
      console.log('%c[AuthContext] Conexión establecida con Firebase Authentication.', 'color: #4CAF50; font-weight: bold;');
      setLoading(true);
      if (isAdminSession) {
          setLoading(false);
          return;
      }
      
      setFirebaseUser(user);
      if (user) {
        const userDocRef = doc(db, "usuarios", user.uid);
        
        const unsubUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
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
  }, [isAdminSession]);

  const login = async (email: string, pass: string): Promise<UserProfile | null> => {
    if (email === MOCK_ADMIN_USER.email && pass === MOCK_ADMIN_USER.password) {
      setIsAdminSession(true);
      setCurrentUser(MOCK_ADMIN_USER);
      setFirebaseUser(null); 
      return MOCK_ADMIN_USER;
    }
    
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
    // This logic should probably be in a backend function for security.
    // For now, we assume this is only called by an authorized admin client-side.
    const q = query(collection(db, "usuarios"), where("email", "==", userData.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error("Este email ya está registrado.");
    }
    
    try {
        // We don't create a Firebase auth user here, this is a local user record
        // This is a FLAWED design, but we'll stick to it for now.
        // A real app would use a Cloud Function to create the auth user.
        const { password, ...restOfData } = userData;
        const newUserProfileData = {
          ...restOfData,
          password, // Storing passwords in Firestore is a major security risk. This is for demo only.
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
  };

  const forcePasswordChange = async (userId: string, newPass: string) => {
      // Storing passwords in Firestore is a major security risk. This is for demo only.
      await editUser(userId, { password: newPass, mustChangePassword: false });
  }

  const deleteUser = async (userId: string) => {
    // This does not delete the Firebase Auth user, only the Firestore record.
    // A real app would need a Cloud Function for this.
    await deleteDoc(doc(db, "usuarios", userId));
  }

  return (
    <AuthContext.Provider value={{ user: currentUser, firebaseUser, fetchAllUsers, isAuthenticated: !!currentUser, loading, login, logout, signup, addUser, editUser, deleteUser, forcePasswordChange }}>
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

    