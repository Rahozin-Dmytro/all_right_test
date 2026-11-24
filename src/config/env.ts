import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env variable ${name}. Copy .env.example to .env and fill it in.`);
  return value;
}

export const env = {
  ci: Boolean(process.env.CI),
  baseUrl: required('BASE_URL'),
  apiUrl: required('API_URL'),
  users: {
    standard: { username: required('STANDARD_USER'), password: required('USER_PASSWORD') },
    locked: { username: required('LOCKED_USER'), password: required('USER_PASSWORD') },
  },
  apiAdmin: { username: required('API_ADMIN_USER'), password: required('API_ADMIN_PASSWORD') },
} as const;

export const STORAGE_STATE = '.auth/user.json';
