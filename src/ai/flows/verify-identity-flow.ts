// This file holds the Genkit flow for verifying a user's identity.
'use server';

/**
 * @fileOverview Verifies a user's identity by comparing their photo with their ID.
 *
 * - verifyIdentity - A function that handles the identity verification process.
 * - VerifyIdentityInput - The input type for the verifyIdentity function.
 * - VerifyIdentityOutput - The return type for the verifyIdentity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import crypto from 'crypto';

export const VerifyIdentityInputSchema = z.object({
  userPhotoDataUri: z.string().describe("A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  documentPhotoDataUri: z.string().describe("A photo of the user's ID document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type VerifyIdentityInput = z.infer<typeof VerifyIdentityInputSchema>;

export const VerifyIdentityOutputSchema = z.object({
  isVerified: z.boolean().describe('Whether the identity was successfully verified.'),
  isOfAge: z.boolean().describe('Whether the user is determined to be of legal age (18+).'),
  isMatch: z.boolean().describe('Whether the face in the user photo matches the face on the ID document.'),
  reason: z.string().optional().describe('The reason for verification failure.'),
});
export type VerifyIdentityOutput = z.infer<typeof VerifyIdentityOutputSchema>;

export async function verifyIdentity(input: VerifyIdentityInput): Promise<VerifyIdentityOutput> {
  return verifyIdentityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyIdentityPrompt',
  input: {schema: VerifyIdentityInputSchema},
  output: {schema: VerifyIdentityOutputSchema},
  prompt: `You are an AI-powered identity verification agent. Your task is to analyze two images: a user's live photo and a photo of their government-issued ID (like a driver's license).

You must perform the following checks:
1.  **Face Match**: Compare the face in the user's photo with the face on the ID. They must be the same person. Set the \`isMatch\` field accordingly.
2.  **Age Verification**: Extract the date of birth from the ID. Calculate if the person is 18 years of age or older as of today's date. Set the \`isOfAge\` field accordingly. Assume today is ${new Date().toLocaleDateString('en-CA')}.
3.  **Overall Verification**: If and only if BOTH the face match is successful AND the user is 18 or older, set \`isVerified\` to true. Otherwise, set it to false.
4.  **Reasoning**: If verification fails (\`isVerified\` is false), provide a clear, concise reason in the \`reason\` field (e.g., "Faces do not match," "User is under 18," "ID document is not clear or is invalid.").

User's Photo:
{{media url=userPhotoDataUri}}

ID Document Photo:
{{media url=documentPhotoDataUri}}`,
});

const verifyIdentityFlow = ai.defineFlow(
  {
    name: 'verifyIdentityFlow',
    inputSchema: VerifyIdentityInputSchema,
    outputSchema: VerifyIdentityOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI failed to process the identity verification.");
    }
    return output;
  }
);
