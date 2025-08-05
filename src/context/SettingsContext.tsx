"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  isVerificationEnabled: boolean;
  setIsVerificationEnabled: (isEnabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isVerificationEnabled, setIsVerificationEnabled] = useState<boolean>(true);

  return (
    <SettingsContext.Provider value={{ isVerificationEnabled, setIsVerificationEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
