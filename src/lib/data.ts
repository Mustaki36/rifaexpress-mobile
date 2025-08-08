
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

// MOCK_USER and MOCK_TACOS_USER are now used to seed the database if it's empty.
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


// MOCK_RAFFLES are now used to seed the database if it's empty.
export const MOCK_RAFFLES: Omit<Raffle, 'createdAt' | 'status'>[] = [
  {
    id: 'car-2024',
    title: 'Rifa de Auto 0km',
    description: 'Participa para ganar un auto completamente nuevo. El modelo es sorpresa, ¡pero te aseguramos que te encantará! Sorteo basado en la Lotería de Puerto Rico.',
    image: 'https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_1.0/c_scale,w_800/ncom/en_US/games/switch/m/mario-kart-8-deluxe-switch/description-image',
    prize: 'Auto del Año 0km',
    ticketPrice: 50,
    totalTickets: 1000,
    soldTickets: Array.from({ length: 750 }, (_, i) => i + 1), // 75% sold
    drawDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
    aiHint: 'new car',
    creatorId: MOCK_USER.id,
  },
  {
    id: 'phone-15-pro',
    title: 'Último Smartphone de Gama Alta',
    description: 'No te quedes atrás y gana el último modelo de smartphone. Con la mejor cámara, procesador y una pantalla increíble. Ideal para trabajo o entretenimiento.',
    image: 'https://placehold.co/600x400.png',
    prize: 'iPhone 15 Pro',
    ticketPrice: 10,
    totalTickets: 100,
    soldTickets: [5, 12, 23, 45, 55, 67, 78, 89, 91, 99, 1, 2, 3],
    drawDate: new Date(new Date().setDate(new Date().getDate() + 15)), // 15 days from now
    aiHint: 'smartphone',
    creatorId: MOCK_USER.id,
  },
  {
    id: 'taco-feast-2024',
    title: '¡Un Año de Tacos Gratis!',
    description: '¿Amante de los tacos? ¡Esta es tu rifa! El ganador recibirá una orden de tacos gratis cada semana durante un año completo en "Tacos Place". ¡Al pastor, carnitas, y más!',
    image: 'https://placehold.co/600x400.png',
    prize: '1 Año de Tacos Gratis',
    ticketPrice: 5,
    totalTickets: 100,
    soldTickets: Array.from({ length: 98 }, (_, i) => i + 1), // Almost sold out
    drawDate: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
    aiHint: 'tacos food',
    creatorId: MOCK_TACOS_USER.id,
  },
   {
    id: 'vacation-paradise',
    title: 'Viaje al Caribe para Dos',
    description: 'Gana un viaje todo incluido para dos personas a un resort de 5 estrellas en el Caribe. Incluye vuelos, hospedaje y comidas. ¡El escape perfecto te espera!',
    image: 'https://placehold.co/600x400.png',
    prize: 'Viaje al Caribe',
    ticketPrice: 25,
    totalTickets: 300,
    soldTickets: [],
    drawDate: new Date(new Date().setDate(new Date().getDate() + 60)), // 60 days from now
    aiHint: 'beach vacation',
    creatorId: MOCK_USER.id,
  },
];

    