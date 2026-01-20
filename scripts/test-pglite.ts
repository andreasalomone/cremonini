
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import path from 'node:path';
import * as schema from '../src/models/Schema';

async function testPglite() {
  console.log('Testing PGlite connection...');

  try {
    const client = new PGlite();
    await client.waitReady;
    console.log('PGlite client ready.');

    const db = drizzle(client, { schema });

    console.log('Running migrations...');
    await migrate(db, {
        migrationsFolder: path.join(process.cwd(), 'migrations'),
    });
    console.log('Migrations completed.');

    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);

    console.log('PGlite test passed!');
  } catch (err) {
    console.error('PGlite failed:', err);
    process.exit(1);
  }
}

testPglite();
