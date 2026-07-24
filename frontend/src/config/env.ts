import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:8000/api'),
  VITE_APP_NAME: z.string().default('TNC Guardian'),
  VITE_ENV: z.string().default('development'),
  VITE_ENABLE_DEMO_MODE: z.preprocess(
    (val) => val === undefined ? 'true' : String(val),
    z.string().transform((val) => val.toLowerCase() === 'true').default('true')
  ),
});

// Validate importing variables
const parsedEnv = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_ENV: import.meta.env.VITE_ENV,
  VITE_ENABLE_DEMO_MODE: import.meta.env.VITE_ENABLE_DEMO_MODE,
});

if (!parsedEnv.success) {
  console.error('Invalid frontend configuration:', parsedEnv.error.format());
  throw new Error('Invalid frontend environment variables');
}

export const env = parsedEnv.data;
