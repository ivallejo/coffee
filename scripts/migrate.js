const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
    try {
        await client.connect();
        console.log('Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, '../src/supabase/migrations/0000_initial_schema.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running initial schema migration...');
        await client.query(migrationSql);
        console.log('Schema migration completed.');

        // Read seed file
        const seedPath = path.join(__dirname, '../src/supabase/seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');

        console.log('Running seed data...');
        await client.query(seedSql);
        console.log('Seed data completed.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigrations();
