"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { BlockedUser } from '@/lib/types';

interface BlockContextType {
  blockedUsers: BlockedUser[];
  blockUser: (email: string, reason: string) => void;
  unblockUser: (email: string) => void;
  updateNotes: (email: string, notes: string) => void;
}

const BlockContext = createContext<BlockContextType | undefined>(undefined);

export const BlockProvider = ({ children }: { children: ReactNode }) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  const blockUser = (email: string, reason: string) => {
    const newBlockedUser: BlockedUser = {
      email,
      reason,
      blockedAt: new Date(),
      notes: '',
    };
    setBlockedUsers(prev => {
        if (prev.some(u => u.email === email)) {
            return prev;
        }
        return [...prev, newBlockedUser];
    });
  };

  const unblockUser = (email: string) => {
    setBlockedUsers(prev => prev.filter(user => user.email !== email));
  };
  
  const updateNotes = (email: string, notes: string) => {
    setBlockedUsers(prev => prev.map(user => 
      user.email === email ? { ...user, notes } : user
    ));
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
