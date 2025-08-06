
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, getDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { Raffle, ReservedTicket } from '@/lib/types';

const RESERVATION_TIME_MS = 5 * 60 * 1000;

interface RaffleContextType {
  raffles: Raffle[];
  reservedTickets: ReservedTicket[];
  loading: boolean;
  addRaffle: (raffle: Omit<Raffle, 'id' | 'soldTickets' | 'createdAt' | 'status'>) => Promise<void>;
  editRaffle: (raffleId: string, raffleData: Partial<Omit<Raffle, 'id'>>) => Promise<void>;
  deleteRaffle: (raffleId: string) => Promise<void>;
  reserveTicket: (raffleId: string, number: number, userId: string) => boolean;
  releaseTicket: (raffleId: string, number: number, userId: string) => void;
  releaseTicketsForUser: (userId: string, raffleId: string) => void;
  purchaseTickets: (raffleId: string, numbers: number[], userId: string) => Promise<void>;
}

const RaffleContext = createContext<RaffleContextType | undefined>(undefined);

export const RaffleProvider = ({ children }: { children: ReactNode }) => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [reservedTickets, setReservedTickets] = useState<ReservedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "raffles"), orderBy("drawDate", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const rafflesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          drawDate: data.drawDate.toDate(),
          // Ensure soldTickets is always an array
          soldTickets: Array.isArray(data.soldTickets) ? data.soldTickets : [],
        } as Raffle;
      });
      setRaffles(rafflesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching raffles: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Cleanup expired reserved tickets
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setReservedTickets(prev => prev.filter(ticket => ticket.expiresAt.getTime() > now.getTime()));
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const addRaffle = async (raffleData: Omit<Raffle, 'id' | 'soldTickets' | 'createdAt' | 'status'>) => {
    await addDoc(collection(db, "raffles"), {
        ...raffleData,
        soldTickets: [],
        status: 'open',
        createdAt: serverTimestamp(),
    });
  };

  const editRaffle = async (raffleId: string, raffleData: Partial<Omit<Raffle, 'id'>>) => {
    const raffleDocRef = doc(db, "raffles", raffleId);
    await updateDoc(raffleDocRef, raffleData);
  };

  const deleteRaffle = async (raffleId: string) => {
    const raffleDocRef = doc(db, "raffles", raffleId);
    await deleteDoc(raffleDocRef);
  };
  
  const reserveTicket = (raffleId: string, number: number, userId: string): boolean => {
    const now = new Date();
    // Re-check raffles state for most up-to-date sold tickets
    const raffle = raffles.find(r => r.id === raffleId);
    if (!raffle) return false;
    
    const isSold = raffle.soldTickets.includes(number);
    const isReserved = reservedTickets.some(
      t => t.raffleId === raffleId && t.number === number && t.expiresAt > now
    );

    if (isSold || isReserved) {
      return false;
    }
    
    const newReservation: ReservedTicket = {
      raffleId,
      number,
      userId,
      expiresAt: new Date(now.getTime() + RESERVATION_TIME_MS),
    };
    
    // Cleanup expired before adding new one
    setReservedTickets(prev => [...prev.filter(t => t.expiresAt > now), newReservation]);
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

  const purchaseTickets = async (raffleId: string, numbers: number[], userId: string) => {
     const raffleDocRef = doc(db, "raffles", raffleId);
     const raffle = raffles.find(r => r.id === raffleId);
     if (!raffle) throw new Error("Raffle not found");
     
     // Ensure no duplicate tickets are added
     const newSoldTickets = [...new Set([...raffle.soldTickets, ...numbers])].sort((a,b) => a-b);
     await updateDoc(raffleDocRef, {
        soldTickets: newSoldTickets
     });

     // Update user's ticket records in Firestore
     if (userId) {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const newTicketRecord = {
                raffleId: raffle.id,
                raffleTitle: raffle.title,
                ticketNumbers: numbers,
            };

            const existingTickets = Array.isArray(userData.tickets) ? userData.tickets : [];
            const existingRaffleIndex = existingTickets.findIndex((t: any) => t.raffleId === raffle.id);
            let updatedTickets = [...existingTickets];

            if (existingRaffleIndex > -1) {
                const existingRecord = updatedTickets[existingRaffleIndex];
                const combinedNumbers = [...new Set([...existingRecord.ticketNumbers, ...numbers])].sort((a,b) => a-b);
                updatedTickets[existingRaffleIndex] = { ...existingRecord, ticketNumbers: combinedNumbers };
            } else {
                updatedTickets.push(newTicketRecord);
            }
            await updateDoc(userDocRef, { tickets: updatedTickets });
        }
     }

     // Remove the now-purchased tickets from the local reservation state
     setReservedTickets(prev => prev.filter(
        t => !(t.raffleId === raffleId && numbers.includes(t.number) && t.userId === userId)
     ));
  };

  return (
    <RaffleContext.Provider value={{ raffles, reservedTickets, loading, addRaffle, editRaffle, deleteRaffle, reserveTicket, releaseTicket, purchaseTickets, releaseTicketsForUser }}>
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
