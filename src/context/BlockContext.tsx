
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { BlockedUser } from '@/lib/types';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from '@/lib/firebase';

interface BlockContextType {
  blockedUsers: BlockedUser[];
  blockUser: (email: string, reason: string) => Promise<void>;
  unblockUser: (email: string) => Promise<void>;
  updateNotes: (email: string, notes: string) => Promise<void>;
}

const BlockContext = createContext<BlockContextType | undefined>(undefined);

export const BlockProvider = ({ children }: { children: ReactNode }) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  useEffect(() => {
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
      });
      return () => unsubscribe();
  }, []);

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

  const unblockUser = async (email: string) => {
    const q = query(collection(db, "blockedUsers"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, "blockedUsers", document.id));
    });
  };
  
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
