import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export const db = {
  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log("Executed query", { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error("Database query error", { text, error });
      throw error;
    }
  },

  async exec(text: string) {
    const statements = text.split(";").filter((s) => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await this.query(statement);
      }
    }
  },

  prepare(text: string) {
    return {
      run: async (...params: any[]) => {
        const result = await db.query(text, params);
        return {
          changes: result.rowCount,
          lastInsertRowid: result.rows[0]?.id,
        };
      },
      get: async (...params: any[]) => {
        const result = await db.query(text, params);
        return result.rows[0];
      },
      all: async (...params: any[]) => {
        const result = await db.query(text, params);
        return result.rows;
      },
    };
  },

  pragma(statement: string) {
    // PostgreSQL doesn't need pragma statements like SQLite
    console.log("Pragma statement (skipped):", statement);
  },
};

export function getDbPath() {
  return process.env.DATABASE_URL || "postgresql://localhost/upsc";
}

export async function closeDb() {
  await pool.end();
}
