import type { Raffle, RaffleResult, UserProfile } from './types';

export const MOCK_RAFFLES: Raffle[] = [
  {
    id: 'car-2024',
    title: 'Rifa de Auto 0km',
    description: 'Participa y gana un auto 0km full equipo. El sueño de tener tu propio vehículo está a un boleto de distancia.',
    image: 'https://placehold.co/600x400',
    prize: 'Auto Sedán 2024',
    ticketPrice: 10,
    totalTickets: 200,
    soldTickets: Array.from({ length: 110 }, (_, i) => i + 15),
    drawDate: new Date('2024-09-30T18:00:00'),
    aiHint: 'new car',
  },
  {
    id: 'phone-15-pro',
    title: 'Último Smartphone de Gama Alta',
    description: 'No te quedes atrás y gana el último modelo de smartphone. Con la mejor cámara y el procesador más potente del mercado.',
    image: 'https://placehold.co/600x400',
    prize: 'Smartphone Pro 15',
    ticketPrice: 5,
    totalTickets: 150,
    soldTickets: Array.from({ length: 50 }, (_, i) => i + 1),
    drawDate: new Date('2024-08-15T20:00:00'),
    aiHint: 'latest smartphone',
  },
  {
    id: 'console-next-gen',
    title: 'Consola de Videojuegos de Nueva Generación',
    description: 'Lleva tu experiencia de juego a otro nivel. Gana la consola más deseada y disfruta de gráficos y velocidades impresionantes.',
    image: 'https://placehold.co/600x400',
    prize: 'Consola de Videojuegos 5',
    ticketPrice: 7,
    totalTickets: 100,
    soldTickets: Array.from({ length: 95 }, (_, i) => i + 1),
    drawDate: new Date('2024-08-25T20:00:00'),
    aiHint: 'gaming console',
  },
  {
    id: 'vacation-caribe',
    title: 'Viaje al Caribe todo incluido',
    description: 'Gana unas vacaciones soñadas para dos personas. Disfruta de playas paradisíacas y relájate en el Caribe.',
    image: 'https://placehold.co/600x400',
    prize: 'Viaje al Caribe',
    ticketPrice: 20,
    totalTickets: 300,
    soldTickets: Array.from({ length: 150 }, (_, i) => i + 50),
    drawDate: new Date('2024-10-10T20:00:00'),
    aiHint: 'tropical beach',
  },
];

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
  avatar: 'https://placehold.co/100x100',
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
