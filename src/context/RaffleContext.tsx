
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, getDoc, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { Raffle, ReservedTicket } from '@/lib/types';
import { useAuth } from './AuthContext';

const RESERVATION_TIME_MS = 5 * 60 * 1000;

interface RaffleContextType {
  raffles: Raffle[];
  reservedTickets: ReservedTicket[];
  loading: boolean;
  addRaffle: (raffle: Omit<Raffle, 'id' | 'soldTickets' | 'createdAt' | 'status'>) => Promise<void>;
  editRaffle: (raffleId: string, raffleData: Partial<Omit<Raffle, 'id'>>) => Promise<void>;
  deleteRaffle: (raffleId: string) => Promise<void>;
  reserveTicket: (raffleId: string, number: number, userId: string) => Promise<boolean>;
  releaseTicket: (raffleId: string, number: number, userId: string) => Promise<void>;
  releaseTicketsForUser: (userId: string, raffleId: string) => Promise<void>;
  purchaseTickets: (raffleId: string, numbers: number[], userId: string) => Promise<void>;
}

const RaffleContext = createContext<RaffleContextType | undefined>(undefined);

export const RaffleProvider = ({ children }: { children: ReactNode }) => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [reservedTickets, setReservedTickets] = useState<ReservedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Listener for raffles collection
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "raffles"), orderBy("drawDate", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log('%c[RaffleContext] Conexión establecida y datos recibidos de Firestore (colección "raffles").', 'color: #4CAF50; font-weight: bold;');
      const rafflesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          drawDate: data.drawDate.toDate(),
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
  
  // Listener for reservations collection - ONLY for authenticated users
  useEffect(() => {
      // If there's no user, don't even try to listen.
      if (!user) {
          setReservedTickets([]); // Clear any stale reservations
          return;
      }

      const q = query(collection(db, "reservations"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const now = new Date();
          const reservationsData: ReservedTicket[] = [];
          const expiredReservationIds: string[] = [];

          snapshot.forEach(doc => {
              const data = doc.data();
              const expiresAt = data.expiresAt.toDate();
              if (expiresAt.getTime() > now.getTime()) {
                  reservationsData.push({
                      id: doc.id,
                      ...data,
                      expiresAt,
                  } as ReservedTicket);
              } else {
                  expiredReservationIds.push(doc.id);
              }
          });

          setReservedTickets(reservationsData);

          // Clean up expired reservations in Firestore
          if (expiredReservationIds.length > 0) {
              const batch = writeBatch(db);
              expiredReservationIds.forEach(id => {
                  batch.delete(doc(db, "reservations", id));
              });
              batch.commit().catch(err => console.error("Failed to delete expired reservations:", err));
          }
      }, (error) => {
          // This will catch permission errors if rules are misconfigured,
          // but our check for `user` should prevent this.
          console.error("Error fetching reservations:", error);
          setReservedTickets([]);
      });
      
      // Cleanup the listener when the user logs out or component unmounts
      return () => unsubscribe();
  }, [user]); // Re-run this effect when the user's auth state changes


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
  
  const reserveTicket = async (raffleId: string, number: number, userId: string): Promise<boolean> => {
    const raffle = raffles.find(r => r.id === raffleId);
    if (!raffle) return false;
    
    // Double check against local state first for quick feedback
    const isSold = raffle.soldTickets.includes(number);
    const isReserved = reservedTickets.some(t => t.raffleId === raffleId && t.number === number);
    if (isSold || isReserved) return false;

    // Proceed to create reservation in Firestore
    try {
        await addDoc(collection(db, "reservations"), {
            raffleId,
            number,
            userId,
            expiresAt: new Date(Date.now() + RESERVATION_TIME_MS),
        });
        return true;
    } catch (error) {
        console.error("Error reserving ticket in Firestore:", error);
        // This might fail due to security rules if a reservation already exists (needs configuration)
        return false;
    }
  };

  const releaseTicket = async (raffleId: string, number: number, userId: string) => {
    const q = query(collection(db, "reservations"), 
        where("raffleId", "==", raffleId),
        where("number", "==", number),
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await deleteDoc(doc(db, "reservations", docId));
    }
  };

  const releaseTicketsForUser = async (userId: string, raffleId: string) => {
    const q = query(collection(db, "reservations"), 
        where("userId", "==", userId),
        where("raffleId", "==", raffleId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
  };

  const purchaseTickets = async (raffleId: string, numbers: number[], userId: string) => {
     const raffleDocRef = doc(db, "raffles", raffleId);
     const raffle = raffles.find(r => r.id === raffleId);
     if (!raffle) throw new Error("Raffle not found");
     
     const newSoldTickets = [...new Set([...raffle.soldTickets, ...numbers])].sort((a,b) => a-b);
     await updateDoc(raffleDocRef, {
        soldTickets: newSoldTickets
     });

     if (userId) {
        const userDocRef = doc(db, "usuarios", userId);
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
     
     // Remove reservations for purchased tickets
    const q = query(collection(db, "reservations"), 
        where("raffleId", "==", raffleId),
        where("userId", "==", userId),
        where("number", "in", numbers)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
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
