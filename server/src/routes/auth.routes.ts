import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const result = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = result.rows[0] as
      | { id: number; username: string; password_hash: string }
      | undefined;

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ username: user.username });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ username: req.session.username });
});

router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({
          error: "Valid current and new password (min 6 chars) required",
        });
    }

    const result = await db.query("SELECT * FROM users WHERE id = $1", [
      req.session.userId,
    ]);
    const user = result.rows[0] as { password_hash: string } | undefined;

    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: "Current password incorrect" });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hash,
      req.session.userId,
    ]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
