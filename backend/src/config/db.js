import pkg from 'pg';
const { Pool } = pkg;
import { ENV } from './env.js';

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  max: 30, // allow up to 30 concurrent database connections for stress testing
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export const query = (text, params) => pool.query(text, params);

/**
 * Execute a transaction block safely with client release and rollback on failure
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

