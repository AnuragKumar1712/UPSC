import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { createApp } from "./app.js";
import { db } from "./db/connection.js";
import { initDatabase } from "./db/init.js";

dotenv.config();

async function start() {
  try {
    await initDatabase();

    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const existing = await db
      .prepare("SELECT id FROM users WHERE username = $1")
      .get(username);
    const hash = bcrypt.hashSync(password, 10);

    if (!existing) {
      await db
        .prepare("INSERT INTO users (username, password_hash) VALUES ($1, $2)")
        .run(username, hash);
    } else if (process.env.FORCE_RESET_PASSWORD === "true") {
      await db
        .prepare("UPDATE users SET password_hash = $1 WHERE username = $2")
        .run(hash, username);
    }

    const app = createApp();
    const PORT = Number(process.env.PORT) || 3001;

    app.listen(PORT, () => {
      console.log(`UPSC MCQ API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
