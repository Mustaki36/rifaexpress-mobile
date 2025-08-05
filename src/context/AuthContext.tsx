
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { UserProfile, VerificationInfo, Address } from '@/lib/types';
import { MOCK_USER } from '@/lib/data';
import crypto from 'crypto';
import { useBlock } from './BlockContext';

// Admin User
const ADMIN_USER: UserProfile = {
  id: 'admin-user-id',
  name: 'Admin',
  email: 'admin@rifasxpress.com',
  isVerified: true,
  role: 'admin',
  createdAt: new Date(),
  tickets: [],
  password: 'password' // This is for the admin panel login
};

// This is a mock user database. In a real application, this would be a database.
const initialUsers: UserProfile[] = [MOCK_USER, ADMIN_USER];

// This is a mock verification code store. In a real app, use a DB or a service like Redis.
const verificationStore = new Map<string, VerificationInfo>();


interface AuthContextType {
  user: UserProfile | null;
  allUsers: UserProfile[];
  isAuthenticated: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  signup: (name: string, email: string, pass: string, phone: string, address: Address, isVerified: boolean, role: 'regular' | 'creator') => void;
  addUser: (userData: Omit<UserProfile, 'id' | 'avatar' | 'tickets' | 'createdAt' | 'isVerified'> & {isVerified?: boolean}) => void;
  editUser: (userId: string, userData: Partial<Omit<UserProfile, 'id'>>) => void;
  deleteUser: (userId: string) => void;
  requestVerificationCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => boolean;
  isEmailBlocked: (email: string) => boolean;
  forcePasswordChange: (userId: string, newPass: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const { blockedUsers, blockUser } = useBlock();

  const isEmailBlocked = (email: string) => {
    return blockedUsers.some(u => u.email === email);
  }

  const requestVerificationCode = (email: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        if (isEmailBlocked(email)) {
          reject(new Error("Este email ha sido bloqueado."));
          return;
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute expiry
        verificationStore.set(email, { code, expiresAt, attempts: 0 });
        console.log(`Verification code for ${email}: ${code}`); // Log for testing
        resolve();
      }, 500);
    });
  };

  const verifyCode = (email: string, code: string): boolean => {
    const info = verificationStore.get(email);
    if (!info) return false;

    // Check expiry
    if (new Date() > info.expiresAt) {
      verificationStore.delete(email); // Clean up expired code
      return false;
    }
    
    // Check code
    if (info.code === code) {
      // Do not delete on success, in case user submits form later
      return true;
    }

    // Handle incorrect code
    info.attempts += 1;
    if (info.attempts >= 3) {
      blockUser(email, 'Demasiados intentos de verificación fallidos.');
      verificationStore.delete(email); // Clean up after blocking
    } else {
      verificationStore.set(email, info);
    }

    return false;
  };

  useEffect(() => {
    // In a real app, you might check for a token in localStorage here
    // For this mock, we'll just start logged out.
  }, []);

  const login = (email: string, pass: string): boolean => {
    if(isEmailBlocked(email)) {
      console.error("Login attempt for blocked email:", email);
      return false;
    }
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    // Mock password check - DO NOT DO THIS IN PRODUCTION
    if (foundUser && pass === foundUser.password) { 
      setCurrentUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };
  
  const addUser = (userData: Omit<UserProfile, 'id' | 'avatar' | 'tickets' | 'createdAt' | 'isVerified'> & {isVerified?: boolean}) => {
     if (isEmailBlocked(userData.email)) {
        throw new Error("Este email ha sido bloqueado y no puede ser registrado.");
    }
    if (users.some(u => u.email === userData.email)) {
      throw new Error("El email ya está registrado.");
    }

    const newUser: UserProfile = {
      ...userData,
      id: `user-${crypto.randomBytes(8).toString('hex')}`,
      isVerified: userData.isVerified || false,
      avatar: `https://placehold.co/100x100.png?text=${userData.name.charAt(0)}`,
      tickets: [],
      createdAt: new Date(),
      mustChangePassword: true,
    };
     setUsers(prevUsers => [...prevUsers, newUser]);
  }
  
  const editUser = (userId: string, userData: Partial<Omit<UserProfile, 'id'>>) => {
    setUsers(prevUsers => prevUsers.map(user => {
      if (user.id !== userId) return user;
      
      const updatedUser = { ...user, ...userData };
      if (userData.name) {
          updatedUser.avatar = `https://placehold.co/100x100.png?text=${userData.name.charAt(0)}`;
      }
      return updatedUser;
    }));

    // Also update the currently logged-in user if they are the one being edited
    if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...userData } as UserProfile : null);
    }
  };

  const forcePasswordChange = (userId: string, newPass: string) => {
    editUser(userId, { password: newPass, mustChangePassword: false });
  }

  const deleteUser = (userId: string) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    if (currentUser?.id === userId) {
        logout();
    }
  }

  const signup = (name: string, email: string, pass: string, phone: string, address: Address, isVerified: boolean, role: 'regular' | 'creator') => {
    addUser({ name, email, password: pass, phone, address, role });
    // Automatically log in the new user
    login(email, pass); 
  };


  return (
    <AuthContext.Provider value={{ user: currentUser, allUsers: users, isAuthenticated: !!currentUser, login, logout, signup, addUser, editUser, deleteUser, requestVerificationCode, verifyCode, isEmailBlocked, forcePasswordChange }}>
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
