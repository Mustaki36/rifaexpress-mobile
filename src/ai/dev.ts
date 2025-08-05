import { config } from 'dotenv';
config();

import '@/ai/flows/ensure-fairness.ts';
import '@/ai/flows/generate-description.ts';
import '@/ai/flows/verify-identity-flow.ts';
import '@/ai/flows/get-lottery-info.ts';
