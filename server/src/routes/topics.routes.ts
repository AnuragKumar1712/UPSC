import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { section_id } = req.query;
    let sql = `SELECT t.*,
      (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id) as question_count,
      s.section_name
      FROM topics t JOIN sections s ON t.section_id = s.id`;
    const params: (string | number)[] = [];
    let paramCount = 1;

    if (section_id) {
      sql += ` WHERE t.section_id = $${paramCount++}`;
      params.push(Number(section_id));
    }
    sql += " ORDER BY s.section_name, t.topic_name";

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { section_id, topic_name } = req.body;
    if (!section_id || !topic_name?.trim()) {
      return res
        .status(400)
        .json({ error: "section_id and topic_name required" });
    }
    try {
      const result = await db.query(
        "INSERT INTO topics (section_id, topic_name) VALUES ($1, $2) RETURNING *",
        [section_id, topic_name.trim()],
      );
      const topic = result.rows[0];
      res.status(201).json(topic);
    } catch {
      res.status(409).json({ error: "Topic already exists in this section" });
    }
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { topic_name } = req.body;
    const result = await db.query(
      `UPDATE topics SET topic_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [topic_name?.trim(), req.params.id],
    );
    const topic = result.rows[0];
    res.json(topic);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM topics WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
