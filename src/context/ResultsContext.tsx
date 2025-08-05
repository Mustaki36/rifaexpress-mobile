
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { RaffleResult } from '@/lib/types';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from '@/lib/firebase';

interface ResultsContextType {
  results: RaffleResult[];
  deleteResult: (resultId: string) => Promise<void>;
}

const ResultsContext = createContext<ResultsContextType | undefined>(undefined);

export const ResultsProvider = ({ children }: { children: ReactNode }) => {
  const [results, setResults] = useState<RaffleResult[]>([]);

  useEffect(() => {
    const q = query(collection(db, "results"), orderBy("drawDate", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const resultsData = querySnapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data(),
            } as RaffleResult;
        });
        setResults(resultsData);
    });

    return () => unsubscribe();
  }, []);

  const deleteResult = async (resultId: string) => {
    await deleteDoc(doc(db, "results", resultId));
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
