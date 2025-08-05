"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { RaffleResult } from '@/lib/types';
import { MOCK_RESULTS } from '@/lib/data';

interface ResultsContextType {
  results: RaffleResult[];
  deleteResult: (resultId: string) => void;
}

const ResultsContext = createContext<ResultsContextType | undefined>(undefined);

export const ResultsProvider = ({ children }: { children: ReactNode }) => {
  const [results, setResults] = useState<RaffleResult[]>(MOCK_RESULTS);

  const deleteResult = (resultId: string) => {
    setResults(prev => prev.filter(result => result.id !== resultId));
  };

  return (
    <ResultsContext.Provider value={{ results, deleteResult }}>
      {children}
    </ResultsContext.Provider>
  );
};

export const useResults = () => {
  const context = useContext(ResultsContext);
  if (context === undefined) {
    throw new Error('useResults must be used within a ResultsProvider');
  }
  return context;
};
