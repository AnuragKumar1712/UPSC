import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createApp } from './app.js';
import { db } from './db/connection.js';
import { initDatabase } from './db/init.js';

dotenv.config();

initDatabase();

const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD || 'admin123';
const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
const hash = bcrypt.hashSync(password, 10);

if (!existing) {
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
} else if (process.env.FORCE_RESET_PASSWORD === 'true') {
  db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, username);
}

const app = createApp();
const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`UPSC MCQ API running on http://localhost:${PORT}`);
});
