
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
  listenToRaffleReservations: (raffleId: string) => () => void;
}

const RaffleContext = createContext<RaffleContextType | undefined>(undefined);

export const RaffleProvider = ({ children }: { children: ReactNode }) => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [reservedTickets, setReservedTickets] = useState<ReservedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "raffles"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const rafflesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
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
  
  const listenToRaffleReservations = useCallback((raffleId: string) => {
    if (!isAuthenticated || !user) {
        setReservedTickets([]);
        return () => {}; // Return an empty unsubscribe function
    }

    // This query now includes the userId, making it more secure and compliant with Firestore rules.
    const q = query(
        collection(db, "reservations"), 
        where("raffleId", "==", raffleId),
        where("userId", "==", user.id) 
    );

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
        
        // This will only contain the current user's reservations, which is intended.
        // We will handle showing other users' reservations as "blocked" on the client
        // without needing a separate insecure query.
        setReservedTickets(reservationsData);

        if (expiredReservationIds.length > 0) {
            const batch = writeBatch(db);
            expiredReservationIds.forEach(id => {
                batch.delete(doc(db, "reservations", id));
            });
            batch.commit().catch(err => console.error("Failed to delete expired reservations:", err));
        }
    }, (error) => {
        console.error("Error fetching reservations:", error);
        setReservedTickets([]);
    });

    return unsubscribe;
  }, [isAuthenticated, user]);


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
    
    const isSold = raffle.soldTickets.includes(number);
    if (isSold) return false;

    // Check for existing reservation for this number
    const reservationQuery = query(
        collection(db, "reservations"),
        where("raffleId", "==", raffleId),
        where("number", "==", number)
    );
    const reservedSnapshot = await getDocs(reservationQuery);
    // Check if any reservation is still valid
    const now = Date.now();
    const activeReservation = reservedSnapshot.docs.find(doc => doc.data().expiresAt.toDate().getTime() > now);
    if (activeReservation) return false;

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
     
    // Release the user's reservations for the purchased tickets
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
    <RaffleContext.Provider value={{ raffles, reservedTickets, loading, addRaffle, editRaffle, deleteRaffle, reserveTicket, releaseTicket, purchaseTickets, releaseTicketsForUser, listenToRaffleReservations }}>
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
