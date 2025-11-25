const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not defined in .env.local');
        }

        await client.connect();
        console.log('Connected to database');

        console.log('Updating profiles table schema...');

        // Add is_active column
        await client.query(`
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
        `);
        console.log('Added is_active column.');

        // Add created_by column
        await client.query(`
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS created_by uuid references auth.users(id);
        `);
        console.log('Added created_by column.');

        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
