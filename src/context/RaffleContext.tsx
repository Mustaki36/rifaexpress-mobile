"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Raffle } from '@/lib/types';
import { MOCK_RAFFLES } from '@/lib/data';

interface RaffleContextType {
  raffles: Raffle[];
  addRaffle: (raffle: Omit<Raffle, 'id' | 'soldTickets'>) => void;
  deleteRaffle: (raffleId: string) => void;
}

const RaffleContext = createContext<RaffleContextType | undefined>(undefined);

export const RaffleProvider = ({ children }: { children: ReactNode }) => {
  const [raffles, setRaffles] = useState<Raffle[]>(MOCK_RAFFLES);

  const addRaffle = (raffleData: Omit<Raffle, 'id' | 'soldTickets'>) => {
    const newRaffle: Raffle = {
      ...raffleData,
      id: `raffle-${Date.now()}-${Math.random()}`,
      soldTickets: [],
    };
    setRaffles(prev => [...prev, newRaffle]);
  };

  const deleteRaffle = (raffleId: string) => {
    setRaffles(prev => prev.filter(raffle => raffle.id !== raffleId));
  };

  return (
    <RaffleContext.Provider value={{ raffles, addRaffle, deleteRaffle }}>
      {children}
    </RaffleContext.Provider>
  );
};

export const useRaffles = () => {
  const context = useContext(RaffleContext);
  if (context === undefined) {
    throw new Error('useRaffles must be used within a RaffleProvider');
  }
  return context;
};
