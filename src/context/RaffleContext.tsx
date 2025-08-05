"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Raffle, ReservedTicket } from '@/lib/types';
import { MOCK_RAFFLES } from '@/lib/data';

const RESERVATION_TIME_MS = 5 * 60 * 1000; // 5 minutes

interface RaffleContextType {
  raffles: Raffle[];
  reservedTickets: ReservedTicket[];
  addRaffle: (raffle: Omit<Raffle, 'id' | 'soldTickets'>) => void;
  deleteRaffle: (raffleId: string) => void;
  reserveTicket: (raffleId: string, number: number, userId: string) => boolean;
  releaseTicket: (raffleId: string, number: number, userId: string) => void;
  releaseTicketsForUser: (userId: string, raffleId: string) => void;
  purchaseTickets: (raffleId: string, numbers: number[], userId: string) => void;
}

const RaffleContext = createContext<RaffleContextType | undefined>(undefined);

export const RaffleProvider = ({ children }: { children: ReactNode }) => {
  const [raffles, setRaffles] = useState<Raffle[]>(MOCK_RAFFLES);
  const [reservedTickets, setReservedTickets] = useState<ReservedTicket[]>([]);

  // Periodically clean up expired reservations
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setReservedTickets(prev => prev.filter(ticket => ticket.expiresAt > now));
    }, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, []);


  const addRaffle = (raffleData: Omit<Raffle, 'id' | 'soldTickets'>) => {
    const newRaffle: Raffle = {
      ...raffleData,
      id: `raffle-${Date.now()}-${Math.random()}`,
      soldTickets: [],
    };
    setRaffles(prev => [newRaffle, ...prev]);
  };

  const deleteRaffle = (raffleId: string) => {
    setRaffles(prev => prev.filter(raffle => raffle.id !== raffleId));
  };
  
  const reserveTicket = (raffleId: string, number: number, userId: string): boolean => {
    const now = new Date();
    // Clean expired tickets before attempting a new reservation
    const validReservations = reservedTickets.filter(t => t.expiresAt > now);

    const isAlreadyReserved = validReservations.some(
      t => t.raffleId === raffleId && t.number === number
    );
    const raffle = raffles.find(r => r.id === raffleId);
    const isSold = raffle?.soldTickets.includes(number);

    if (isAlreadyReserved || isSold) {
      return false;
    }
    
    const newReservation: ReservedTicket = {
      raffleId,
      number,
      userId,
      expiresAt: new Date(now.getTime() + RESERVATION_TIME_MS),
    };
    
    setReservedTickets([...validReservations, newReservation]);
    return true;
  };

  const releaseTicket = (raffleId: string, number: number, userId: string) => {
    setReservedTickets(prev => prev.filter(
      t => !(t.raffleId === raffleId && t.number === number && t.userId === userId)
    ));
  };

  const releaseTicketsForUser = useCallback((userId: string, raffleId: string) => {
      setReservedTickets(prev => prev.filter(
          t => !(t.userId === userId && t.raffleId === raffleId)
      ))
  }, []);

  const purchaseTickets = (raffleId: string, numbers: number[], userId: string) => {
     // 1. Move reserved tickets to sold
     setRaffles(prev => prev.map(r => {
        if (r.id === raffleId) {
            return { ...r, soldTickets: [...r.soldTickets, ...numbers].sort((a,b) => a-b) };
        }
        return r;
     }));
     // 2. Remove the reservations that were just purchased
     setReservedTickets(prev => prev.filter(
        t => !(t.raffleId === raffleId && numbers.includes(t.number) && t.userId === userId)
     ));
     // 3. Add ticket info to user profile (assuming AuthContext is available or can be updated)
     // This part is complex as it requires cross-context communication. 
     // For this mock, we'll skip updating the user's `tickets` array in AuthContext.
     // In a real app, this would likely be an API call that updates both raffle and user data transactionally.
  };


  return (
    <RaffleContext.Provider value={{ raffles, reservedTickets, addRaffle, deleteRaffle, reserveTicket, releaseTicket, purchaseTickets, releaseTicketsForUser }}>
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
