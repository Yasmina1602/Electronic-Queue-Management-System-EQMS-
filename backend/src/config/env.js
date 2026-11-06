import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from current directory first, then fallback to backend/.env or root/.env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;
  const name = process.env.DB_NAME || 'elektron_navbat_db';
  const user = process.env.DB_USER || 'postgres';
  const pass = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '1234';

  return `postgresql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${name}`;
}

export const ENV = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: resolveDatabaseUrl(),
  JWT_SECRET: process.env.JWT_SECRET || 'qms_default_jwt_secret_2026',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

