import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { db } from './connection.js';
import { initDatabase } from './init.js';

dotenv.config();

initDatabase();

const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD || 'admin123';
const hash = bcrypt.hashSync(password, 10);

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
if (existing) {
  db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, username);
  console.log(`Updated admin user: ${username}`);
} else {
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
  console.log(`Created admin user: ${username}`);
}

console.log('Database seeded successfully.');
