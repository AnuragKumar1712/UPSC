import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { db } from "./connection.js";
import { initDatabase } from "./init.js";

dotenv.config();

async function seed() {
  try {
    await initDatabase();

    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const hash = bcrypt.hashSync(password, 10);

    const existing = await db.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );
    if (existing.rows.length > 0) {
      await db.query(
        "UPDATE users SET password_hash = $1 WHERE username = $2",
        [hash, username],
      );
      console.log(`Updated admin user: ${username}`);
    } else {
      await db.query(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
        [username, hash],
      );
      console.log(`Created admin user: ${username}`);
    }

    console.log("Database seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
