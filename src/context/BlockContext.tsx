
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { BlockedUser } from '@/lib/types';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';

interface BlockContextType {
  blockedUsers: BlockedUser[];
  blockUser: (email: string, reason: string) => Promise<void>;
  unblockUser: (email: string) => Promise<void>;
  updateNotes: (email: string, notes: string) => Promise<void>;
}

const BlockContext = createContext<BlockContextType | undefined>(undefined);

export const BlockProvider = ({ children }: { children: ReactNode }) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const { user } = useAuth(); // Usamos el hook de autenticación

  // onSnapshot crea un listener en tiempo real para la colección "blockedUsers".
  // Esto mantiene la lista de usuarios bloqueados sincronizada en toda la aplicación.
  useEffect(() => {
      // Solo establecemos el listener si hay un usuario y es un admin.
      if (user && user.role === 'admin') {
          const q = query(collection(db, "blockedUsers"));
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
              const usersData = querySnapshot.docs.map(doc => {
                  const data = doc.data();
                  return {
                      id: doc.id,
                      ...data,
                      blockedAt: data.blockedAt.toDate(),
                  } as BlockedUser;
              });
              setBlockedUsers(usersData);
          }, (error) => {
              console.error("Error listening to blocked users:", error);
              setBlockedUsers([]);
          });
          // Limpiamos el listener cuando el componente se desmonta o el usuario cambia.
          return () => unsubscribe();
      } else {
          // Si no es un admin, la lista de bloqueados está vacía y no hay listener.
          setBlockedUsers([]);
      }
  }, [user]); // El efecto se vuelve a ejecutar si el estado del usuario cambia.

  // Función para añadir un nuevo usuario a la colección de bloqueados.
  const blockUser = async (email: string, reason: string) => {
    const isAlreadyBlocked = blockedUsers.some(u => u.email === email);
    if(isAlreadyBlocked) return;

    await addDoc(collection(db, "blockedUsers"), {
      email,
      reason,
      notes: '',
      blockedAt: serverTimestamp(),
    });
  };

  // Función para eliminar un usuario de la colección de bloqueados.
  const unblockUser = async (email: string) => {
    // Busca el documento por email para obtener su ID y poder borrarlo.
    const q = query(collection(db, "blockedUsers"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, "blockedUsers", document.id));
    });
  };
  
  // Función para actualizar las notas sobre un usuario bloqueado.
  const updateNotes = async (email: string, notes: string) => {
    const q = query(collection(db, "blockedUsers"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (document) => {
        await updateDoc(doc(db, "blockedUsers", document.id), { notes });
    });
  };

  return (
    <BlockContext.Provider value={{ blockedUsers, blockUser, unblockUser, updateNotes }}>
      {children}
    </BlockContext.Provider>
  );
};

export const useBlock = () => {
  const context = useContext(BlockContext);
  if (context === undefined) {
    throw new Error('useBlock must be used within a BlockProvider');
  }
  return context;
};
