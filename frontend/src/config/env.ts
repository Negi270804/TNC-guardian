import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:8000/api'),
});

// Validate importing variables
const parsedEnv = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
});

if (!parsedEnv.success) {
  console.error('Invalid frontend configuration:', parsedEnv.error.format());
  throw new Error('Invalid frontend environment variables');
}

export const env = parsedEnv.data;
