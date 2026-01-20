
import { Client } from 'pg';

async function testConnection() {
  console.log('Testing DB connection...');
  console.log(`DATABASE_URL present: ${!!process.env.DATABASE_URL}`);

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing!');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const start = Date.now();
  try {
    console.log('Connecting...');
    await client.connect();
    console.log(`Connected in ${Date.now() - start}ms`);

    const queryStart = Date.now();
    const res = await client.query('SELECT NOW()');
    console.log(`Query "SELECT NOW()" result:`, res.rows[0]);
    console.log(`Query took ${Date.now() - queryStart}ms`);

    await client.end();
    console.log('Connection closed.');
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

testConnection();
