
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

  // Función para obtener todos los usuarios de la colección "users" en Firestore.
  const fetchAllUsers = async () => {
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
  };

  // Efecto que se ejecuta al cargar el componente para escuchar cambios en la autenticación.
  useEffect(() => {
    // onAuthStateChanged es el listener principal de Firebase Auth.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Lógica para el usuario administrador (no está en Firebase Auth).
        if (user.email === MOCK_ADMIN_USER.email) {
            setCurrentUser(MOCK_ADMIN_USER);
            setLoading(false);
            return;
        }
        // Si hay un usuario, busca su perfil en la base de datos Firestore.
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

  // Función para verificar si un email está en la lista de bloqueo.
  const isEmailBlocked = (email: string) => {
    return blockedUsers.some(u => u.email === email);
  }

  // Función para iniciar sesión.
  const login = async (email: string, pass: string): Promise<UserProfile | null> => {
    if(isEmailBlocked(email)) {
      throw new Error("Este email ha sido bloqueado.");
    }
    
    // Lógica para el login del administrador.
    if (email === MOCK_ADMIN_USER.email && pass === MOCK_ADMIN_USER.password) {
      setFirebaseUser({ email: MOCK_ADMIN_USER.email } as FirebaseUser);
      setCurrentUser(MOCK_ADMIN_USER);
      return MOCK_ADMIN_USER;
    }
    
    // signInWithEmailAndPassword es la función de Firebase para autenticar.
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const userDocRef = doc(db, "users", userCredential.user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userProfile = { id: userCredential.user.uid, ...userData } as UserProfile;
        
        // Simulación de verificación de contraseña guardada en Firestore.
        if (userData.password !== pass) {
            throw new Error("auth/invalid-credential");
        }

        setCurrentUser(userProfile);
        return userProfile;
    }

    return null;
  };

  // Función para cerrar sesión.
  const logout = async () => {
    if (currentUser?.role === 'admin') {
      setCurrentUser(null);
      setFirebaseUser(null);
    } else {
      // signOut es la función de Firebase para cerrar la sesión.
      await signOut(auth);
    }
  };
  
  // Función para registrar un nuevo usuario.
  const signup = async (name: string, email: string, pass: string, phone: string, address: Address, isVerified: boolean, role: 'regular' | 'creator') => {
    if (isEmailBlocked(email)) {
      throw new Error("Este email ha sido bloqueado.");
    }

    // 1. Crea la cuenta en Firebase Authentication.
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    // 2. Crea el documento del perfil del usuario en la base de datos Firestore.
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

    // setDoc crea o sobrescribe un documento en Firestore.
    await setDoc(doc(db, "users", user.uid), {
        ...newUserProfile,
        createdAt: serverTimestamp(), // Guarda la fecha actual del servidor.
    });
    
    await fetchAllUsers(); // Actualiza la lista de usuarios.
  };

  // Función para que un administrador añada un usuario.
  const addUser = async (userData: Omit<UserProfile, 'id' | 'avatar' | 'tickets' | 'createdAt' | 'isVerified' | 'mustChangePassword'> & { password: string }) => {
     if (isEmailBlocked(userData.email)) {
      throw new Error("Este email ha sido bloqueado y no puede ser registrado.");
    }
    
    // Verifica si el email ya existe en la base de datos.
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

        // addDoc crea un nuevo documento con un ID autogenerado en Firestore.
        const docRef = await addDoc(collection(db, "users"), newUserProfileData);
        // Actualiza el estado local para que el cambio se vea al instante.
        setAllUsers(prevUsers => [...prevUsers, { id: docRef.id, ...newUserProfileData, createdAt: new Date() } as UserProfile]);

    } catch (error) {
        console.error("Error al crear usuario en Firestore:", error);
        throw new Error('No se pudo crear el usuario en Firestore.');
    }
  }
  
  // Función para editar un usuario existente.
  const editUser = async (userId: string, userData: Partial<Omit<UserProfile, 'id'>>) => {
    const userDocRef = doc(db, "users", userId);
    // updateDoc actualiza los campos de un documento existente.
    await updateDoc(userDocRef, userData);
    
    // Actualiza el estado local para reflejar los cambios.
    setAllUsers(prevUsers => prevUsers.map(user => user.id === userId ? { ...user, ...userData } : user));

    if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...userData } : null);
    }
  };

  // Función para forzar el cambio de contraseña.
  const forcePasswordChange = async (userId: string, newPass: string) => {
      await editUser(userId, { password: newPass, mustChangePassword: false });
  }

  // Función para eliminar un usuario.
  const deleteUser = async (userId: string) => {
    console.warn(`Eliminando usuario ${userId} solo de Firestore. El usuario de Auth todavía puede existir.`);
    // deleteDoc elimina un documento de Firestore.
    await deleteDoc(doc(db, "users", userId));
    // Actualiza el estado local.
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
