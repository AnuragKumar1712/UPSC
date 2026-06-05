import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*,
        (SELECT COUNT(*) FROM topics t WHERE t.section_id = s.id) as topic_count,
        (SELECT COUNT(*) FROM questions q
         JOIN topics t ON q.topic_id = t.id WHERE t.section_id = s.id) as question_count
       FROM sections s ORDER BY s.section_name`,
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { section_name } = req.body;
    if (!section_name?.trim()) {
      return res.status(400).json({ error: "Section name required" });
    }
    try {
      const result = await db.query(
        "INSERT INTO sections (section_name) VALUES ($1) RETURNING *",
        [section_name.trim()],
      );
      const section = result.rows[0];
      res.status(201).json(section);
    } catch {
      res.status(409).json({ error: "Section already exists" });
    }
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { section_name } = req.body;
    const result = await db.query(
      `UPDATE sections SET section_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [section_name?.trim(), req.params.id],
    );
    const section = result.rows[0];
    res.json(section);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM sections WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
