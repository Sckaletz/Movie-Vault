import pg from "pg";

const { Pool } = pg;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url.replace(/^['"]|['"]$/g, "");
}

function shouldUseSsl(url: string): boolean {
  // Enable SSL only for managed/remote databases that request it
  // (e.g. "...sslmode=require"). A local Postgres (such as the Docker
  // "db" service) does not support SSL by default, so disable it there.
  return /sslmode=require/i.test(url);
}

const databaseUrl = getDatabaseUrl();

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: false } : false,
});

export async function initDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seen_movies (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL,
      movie_id INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, movie_id)
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_seen_movies_user_id ON seen_movies(user_id)
  `);
}
