
import type { Timestamp } from "firebase/firestore";

export type Raffle = {
  id: string;
  title: string;
  description: string;
  image: string;
  prize: string;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number[];
  drawDate: Date;
  aiHint: string;
  creatorId: string; // user ID
  status?: 'open' | 'closed';
  createdAt?: Timestamp;
};

export type RaffleResult = {
  id: string;
  raffleTitle: string;
  winningNumber: number;
  winnerName: string;
  drawDate: string;
  fairnessProof: string;
};

export type Address = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: Address;
  isVerified: boolean;
  avatar: string;
  role: 'regular' | 'creator' | 'admin';
  createdAt: Date | Timestamp;
  mustChangePassword?: boolean;
  tickets: {
    raffleId: string;
    raffleTitle: string;
    ticketNumbers: number[];
  }[];
};

export type VerificationInfo = {
  code: string;
  expiresAt: Date;
  attempts: number;
};

export type BlockedUser = {
  id: string;
  email: string;
  blockedAt: Date | Timestamp;
  reason: string;
  notes: string;
};

export type ReservedTicket = {
  id?: string; // Firestore document ID
  raffleId: string;
  number: number;
  userId: string;
  expiresAt: Date;
};
