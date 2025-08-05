
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

// MOCK data is no longer used as the primary data source.
// They are kept here for reference or potential database seeding in the future.

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
