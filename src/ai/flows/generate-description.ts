// This file holds the Genkit flow for generating a raffle description.
'use server';

/**
 * @fileOverview Generates a catchy and engaging description for a raffle based on a short prompt.
 *
 * - generateDescription - A function that generates the raffle description.
 * - GenerateDescriptionInput - The input type for the generateDescription function.
 * - GenerateDescriptionOutput - The return type for the generateDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDescriptionInputSchema = z.object({
  prompt: z.string().describe('A short prompt describing the raffle.'),
});

export type GenerateDescriptionInput = z.infer<typeof GenerateDescriptionInputSchema>;

const GenerateDescriptionOutputSchema = z.object({
  description: z.string().describe('A catchy and engaging description for the raffle.'),
});

export type GenerateDescriptionOutput = z.infer<typeof GenerateDescriptionOutputSchema>;

export async function generateDescription(input: GenerateDescriptionInput): Promise<GenerateDescriptionOutput> {
  return generateDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDescriptionPrompt',
  input: {schema: GenerateDescriptionInputSchema},
  output: {schema: GenerateDescriptionOutputSchema},
  prompt: `Eres un experto en marketing especializado en escribir descripciones atractivas y cautivadoras para rifas.

Basado en la siguiente descripción proporcionada por el usuario, mejórala para que sea más atractiva para los participantes. Mantén el idioma original.

Descripción del Usuario:
"{{{prompt}}}"

Descripción Mejorada:`,
});

const generateDescriptionFlow = ai.defineFlow({
  name: 'generateDescriptionFlow',
  inputSchema: GenerateDescriptionInputSchema,
  outputSchema: GenerateDescriptionOutputSchema,
}, async input => {
  if (!input.prompt) {
    throw new Error('El prompt no puede estar vacío.');
  }
  const {output} = await prompt(input);
  if (!output) {
    throw new Error('La IA no pudo generar una descripción.');
  }
  return output;
});
