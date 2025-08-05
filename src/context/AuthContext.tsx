"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import { MOCK_USER } from '@/lib/data';
import crypto from 'crypto';

// This is a mock user database. In a real application, this would be a database.
const users: UserProfile[] = [MOCK_USER];

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  signup: (name: string, email: string, pass: string, phone: string, address: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // In a real app, you might check for a token in localStorage here
    // For this mock, we'll just start logged out.
  }, []);

  const login = (email: string, pass: string): boolean => {
    // This is a MOCK login. In a real app, you'd verify against a backend.
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

  const signup = (name: string, email: string, pass: string, phone: string, address: string) => {
    if (users.some(u => u.email === email)) {
      throw new Error("El email ya está registrado.");
    }

    const newUser: UserProfile = {
      id: `user-${crypto.randomBytes(8).toString('hex')}`,
      name,
      email,
      phone,
      address,
      isVerified: true, // Set to true after successful AI verification
      avatar: `https://placehold.co/100x100?text=${name.charAt(0)}`,
      tickets: [],
      // In a real app, you would hash the password
    };

    users.push(newUser);
    // Automatically log in the new user
    // NOTE: We are using "password" as a mock password for all users
    login(email, "password"); 
  };


  return (
    <AuthContext.Provider value={{ user: currentUser, isAuthenticated: !!currentUser, login, logout, signup }}>
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
