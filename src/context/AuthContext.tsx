"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { UserProfile, VerificationInfo } from '@/lib/types';
import { MOCK_USER } from '@/lib/data';
import crypto from 'crypto';
import { useBlock } from './BlockContext';

// This is a mock user database. In a real application, this would be a database.
const users: UserProfile[] = [MOCK_USER];

// This is a mock verification code store. In a real app, use a DB or a service like Redis.
const verificationStore = new Map<string, VerificationInfo>();


interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  signup: (name: string, email: string, pass: string, phone: string, address: string, isVerified: boolean) => void;
  requestVerificationCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => boolean;
  isEmailBlocked: (email: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const { blockedUsers, blockUser } = useBlock();

  const isEmailBlocked = (email: string) => {
    return blockedUsers.some(u => u.email === email);
  }

  const requestVerificationCode = (email: string): Promise<void> => {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        if (isEmailBlocked(email)) {
          throw new Error("Este email ha sido bloqueado.");
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
      verificationStore.delete(email); // Clean up on success
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
    // This is a MOCK login. In a real app, you'd verify against a backend.
    if(isEmailBlocked(email)) {
      console.error("Login attempt for blocked email:", email);
      return false;
    }
    const foundUser = users.find(u => u.email === email);
    // Mock password check - DO NOT DO THIS IN PRODUCTION
    if (foundUser && pass === 'password') { 
      setCurrentUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const signup = (name: string, email: string, pass: string, phone: string, address: string, isVerified: boolean) => {
    if (isEmailBlocked(email)) {
        throw new Error("Este email ha sido bloqueado y no puede ser registrado.");
    }
    if (users.some(u => u.email === email)) {
      throw new Error("El email ya está registrado.");
    }

    const newUser: UserProfile = {
      id: `user-${crypto.randomBytes(8).toString('hex')}`,
      name,
      email,
      phone,
      address,
      isVerified,
      avatar: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
      tickets: [],
      // In a real app, you would hash the password
    };

    users.push(newUser);
    // Automatically log in the new user
    // NOTE: We are using "password" as a mock password for all users
    login(email, "password"); 
  };


  return (
    <AuthContext.Provider value={{ user: currentUser, isAuthenticated: !!currentUser, login, logout, signup, requestVerificationCode, verifyCode, isEmailBlocked }}>
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
