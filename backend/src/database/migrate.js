import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigration() {
  console.log('--- Running PostgreSQL Database Migration ---');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await query(schemaSql);
    console.log('✓ Tables, constraints and indices successfully created/verified.');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration()
    .then(() => {
      console.log('Migration completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

