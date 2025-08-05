// This file holds the Genkit flow for getting lottery information.
'use server';

/**
 * @fileOverview Determines the next lottery draw date and winning number.
 *
 * - getLotteryInfo - A function that returns lottery draw details.
 * - GetLotteryInfoInput - The input type for the getLotteryInfo function.
 * - GetLotteryInfoOutput - The return type for the getLotteryInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetLotteryInfoInputSchema = z.object({
  totalTickets: z.number().describe('The total number of tickets in the raffle to determine the lottery type.'),
});
export type GetLotteryInfoInput = z.infer<typeof GetLotteryInfoInputSchema>;

const GetLotteryInfoOutputSchema = z.object({
  lotteryName: z.string().describe('The name of the corresponding lottery game (e.g., "Pega 2", "Pega 3").'),
  nextDrawDate: z.string().describe('The ISO 8601 string of the next draw date.'),
  winningNumber: z.number().optional().describe('The winning number if the draw has already occurred.'),
});
export type GetLotteryInfoOutput = z.infer<typeof GetLotteryInfoOutputSchema>;

export async function getLotteryInfo(input: GetLotteryInfoInput): Promise<GetLotteryInfoOutput> {
  return getLotteryInfoFlow(input);
}

const getLotteryName = (totalTickets: number): string => {
    if (totalTickets <= 100) return "Pega 2";
    if (totalTickets <= 1000) return "Pega 3";
    if (totalTickets <= 10000) return "Pega 4";
    return "Lotería Tradicional";
};

// In a real application, this flow would use a tool to fetch live data from a lottery API.
// For this demonstration, we will simulate the data.
const getLotteryInfoFlow = ai.defineFlow(
  {
    name: 'getLotteryInfoFlow',
    inputSchema: GetLotteryInfoInputSchema,
    outputSchema: GetLotteryInfoOutputSchema,
  },
  async ({ totalTickets }) => {
    const lotteryName = getLotteryName(totalTickets);

    // Simulate fetching the next draw date.
    // Let's assume draws are daily at 9 PM.
    const now = new Date();
    const nextDraw = new Date(now);
    nextDraw.setHours(21, 0, 0, 0);
    if (now.getHours() >= 21) {
        // If it's past 9 PM, the next draw is tomorrow
        nextDraw.setDate(nextDraw.getDate() + 1);
    }
    
    // This is a placeholder. A real implementation would not return a winning number
    // until after the draw date has passed.
    const winningNumber = undefined;

    return {
        lotteryName,
        nextDrawDate: nextDraw.toISOString(),
        winningNumber,
    };
  }
);
