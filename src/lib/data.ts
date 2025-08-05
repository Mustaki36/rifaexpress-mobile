
import type { Raffle, RaffleResult, UserProfile } from './types';

export const MOCK_ADMIN_USER: UserProfile = {
  id: 'admin-user-id',
  name: 'Admin',
  email: 'admin@rifasxpress.com',
  password: 'password',
  isVerified: true,
  avatar: 'https://placehold.co/100x100.png?text=A',
  role: 'admin',
  createdAt: new Date(),
  tickets: [],
};

// MOCK_RAFFLES are no longer used as the primary data source.
// They are kept here for reference or potential database seeding in the future.

export const MOCK_RESULTS: RaffleResult[] = [
  {
    id: 'tv-4k-qled',
    raffleTitle: 'Smart TV 4K 65"',
    winningNumber: 88,
    winnerName: 'Ana G.',
    drawDate: '2024-07-15',
    fairnessProof: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  },
  {
    id: 'laptop-gamer',
    raffleTitle: 'Laptop Gamer Pro',
    winningNumber: 23,
    winnerName: 'Carlos M.',
    drawDate: '2024-07-01',
    fairnessProof: 'f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5',
  },
  {
    id: 'gift-card-500',
    raffleTitle: 'Tarjeta de Regalo de $500',
    winningNumber: 145,
    winnerName: 'Sofía R.',
    drawDate: '2024-06-20',
    fairnessProof: '7g8h9i0j7g8h9i0j7g8h9i0j7g8h9i0j7g8h9i0j7g8h9i0j7g8h9i0j7g8h9i0j',
  },
];

export const MOCK_USER: UserProfile = {
  id: 'user-123',
  name: 'Juan Pérez',
  email: 'juan.perez@example.com',
  password: 'password123',
  isVerified: false,
  phone: '787-123-4567',
  address: {
    street: "123 Calle Principal",
    city: "San Juan",
    state: "PR",
    postalCode: "00901",
    country: "Puerto Rico"
  },
  avatar: 'https://placehold.co/100x100.png',
  role: 'creator',
  createdAt: new Date('2024-01-15T10:30:00'),
  tickets: [
    {
      raffleId: 'car-2024',
      raffleTitle: 'Rifa de Auto 0km',
      ticketNumbers: [22, 58, 134],
    },
    {
      raffleId: 'phone-15-pro',
      raffleTitle: 'Último Smartphone de Gama Alta',
      ticketNumbers: [7, 81],
    },
  ],
};
