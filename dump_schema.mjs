import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function dumpSchema() {
    // Requires pg. Checking if we have a connection string in env.
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (!connectionString) {
        console.error("No DATABASE_URL found");
        return;
    }

    const client = new Client({ connectionString });
    await client.connect();

    try {
        const query = `
            SELECT 
                t.table_name,
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.column_default,
                tc.constraint_type,
                kcu.column_name AS key_column,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name
            LEFT JOIN information_schema.key_column_usage kcu 
                ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
            LEFT JOIN information_schema.table_constraints tc 
                ON kcu.constraint_name = tc.constraint_name
            LEFT JOIN information_schema.constraint_column_usage ccu 
                ON tc.constraint_name = ccu.constraint_name
            WHERE t.table_schema = 'public' 
            ORDER BY t.table_name, c.ordinal_position;
        `;
        const res = await client.query(query);
        fs.writeFileSync('schema_dump.json', JSON.stringify(res.rows, null, 2));
        console.log("Schema dumped successfully");
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
dumpSchema();
