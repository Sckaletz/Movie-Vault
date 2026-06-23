import pg from "pg";

const { Pool } = pg;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const cleaned = url.replace(/^['"]|['"]$/g, "");

  // Basic validation: must be a postgres connection string
  if (!cleaned.startsWith("postgresql://") && !cleaned.startsWith("postgres://")) {
    throw new Error(
        `Invalid DATABASE_URL: must start with postgresql:// or postgres://. Got: ${cleaned.substring(0, 50)}...`,
    );
  }

  return cleaned;
}

function shouldUseSsl(url: string): boolean {
  // DATABASE_SSL is the explicit override — set it when the connection
  // string doesn't contain "sslmode=require" but the provider still needs
  // SSL (common with managed Postgres). Without an explicit signal, default
  // to off so a local/internal Docker Postgres (e.g. Dokploy's own "db"
  // service) keeps working without certs.
  if (process.env.DATABASE_SSL !== undefined) {
    return process.env.DATABASE_SSL === "true";
  }
  return /sslmode=(require|verify-ca|verify-full)/i.test(url);
}

const databaseUrl = getDatabaseUrl();

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: true } : false,
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
