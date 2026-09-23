import fs from 'node:fs';
import path from 'node:path';

// Load e2e/.env when present so E2E_EMAIL / E2E_PASSWORD can be kept out of the shell history.
const envFile = path.resolve(__dirname, '.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export const config = {
  baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173/',
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Set it in the shell or in e2e/.env before running the login tests.`,
    );
  }
  return value;
}

export function credentials() {
  return {
    email: requireEnv('E2E_EMAIL'),
    password: requireEnv('E2E_PASSWORD'),
  };
}
