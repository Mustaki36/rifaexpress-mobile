
import type { Raffle, RaffleResult, UserProfile } from './types';

// This is now a TEMPLATE for a real admin user in Firestore, not a mock local user.
// The ID should match a real document in the 'usuarios' collection.
export const MOCK_ADMIN_USER: UserProfile = {
  id: 'firebase-admin-user-id', // This ID is a placeholder and should match the UID from Firebase Auth.
  name: 'Admin',
  email: 'admin@rifasxpress.com',
  // The password is now managed by Firebase Authentication, not stored here.
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

export const MOCK_TACOS_USER: UserProfile = {
  id: 'user-tacos',
  name: 'Tacos Place',
  email: 'lostacosplace@gmail.com',
  password: 'passwordtacos',
  isVerified: true,
  phone: '555-123-4567',
  address: {
    street: "456 Taco Street",
    city: "Mexico City",
    state: "CDMX",
    postalCode: "06000",
    country: "Mexico"
  },
  avatar: 'https://placehold.co/100x100.png?text=T',
  role: 'creator',
  createdAt: new Date('2024-03-20T12:00:00'),
  tickets: [],
};
