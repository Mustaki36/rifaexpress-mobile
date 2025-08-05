import type { User } from "lucide-react";

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
  creatorId: string; // 'admin' or user ID
  status?: 'open' | 'closed';
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
  role: 'regular' | 'creator';
  createdAt: Date;
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
  email: string;
  blockedAt: Date;
  reason: string;
  notes: string;
};

export type ReservedTicket = {
  raffleId: string;
  number: number;
  userId: string;
  expiresAt: Date;
};
