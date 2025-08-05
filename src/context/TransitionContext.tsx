
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TransitionContextType {
  duration: number;
  setAnimationDuration: (duration: number) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const TransitionProvider = ({ children }: { children: ReactNode }) => {
  const [duration, setDuration] = useState<number>(0.5); // Default fast duration

  const setAnimationDuration = (newDuration: number) => {
    setDuration(newDuration);
  };

  return (
    <TransitionContext.Provider value={{ duration, setAnimationDuration }}>
      {children}
    </TransitionContext.Provider>
  );
};

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (context === undefined) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
};
