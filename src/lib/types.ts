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
};

export type RaffleResult = {
  id: string;
  raffleTitle: string;
  winningNumber: number;
  winnerName: string;
  drawDate: string;
  fairnessProof: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  isVerified: boolean;
  avatar: string;
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
