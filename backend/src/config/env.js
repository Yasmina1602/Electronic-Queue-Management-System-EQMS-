import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/elektron_navbat_db',
  JWT_SECRET: process.env.JWT_SECRET || 'qms_default_jwt_secret_2026',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

