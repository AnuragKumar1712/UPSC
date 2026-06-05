import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/questions", async (req, res) => {
  try {
    const { type = "wrong", limit = 20 } = req.query;
    const max = Math.min(Number(limit) || 20, 100);
    let idsResult;

    switch (type) {
      case "wrong":
        idsResult = await db.query(
          `SELECT DISTINCT q.id FROM questions q
           JOIN user_answers ua ON ua.question_id = q.id
           WHERE ua.is_correct = 0 AND ua.selected_option IS NOT NULL
           ORDER BY RANDOM() LIMIT $1`,
          [max],
        );
        break;
      case "bookmarked":
        idsResult = await db.query(
          `SELECT q.id FROM questions q
           JOIN bookmarks b ON b.question_id = q.id
           ORDER BY RANDOM() LIMIT $1`,
          [max],
        );
        break;
      case "weak":
        idsResult = await db.query(
          `SELECT q.id FROM questions q
           JOIN user_answers ua ON ua.question_id = q.id
           GROUP BY q.id
           HAVING CAST(SUM(ua.is_correct) AS REAL) / COUNT(*) < 0.5
           ORDER BY RANDOM() LIMIT $1`,
          [max],
        );
        break;
      case "recent":
        idsResult = await db.query(
          "SELECT id FROM questions ORDER BY created_at DESC LIMIT $1",
          [max],
        );
        break;
      case "random":
      default:
        idsResult = await db.query(
          "SELECT id FROM questions ORDER BY RANDOM() LIMIT $1",
          [max],
        );
    }

    const ids = idsResult.rows as { id: number }[];

    const questions = await Promise.all(
      ids.map(async (row) => {
        const qResult = await db.query(
          `SELECT q.id, q.question_text, q.correct_answer, q.difficulty_level, q.tags,
            t.topic_name, s.section_name
           FROM questions q
           JOIN topics t ON q.topic_id = t.id
           JOIN sections s ON t.section_id = s.id
           WHERE q.id = $1`,
          [row.id],
        );
        const q = qResult.rows[0];
        const optionsResult = await db.query(
          "SELECT id, option_text FROM options WHERE question_id = $1 ORDER BY RANDOM()",
          [row.id],
        );
        return { ...q, options: optionsResult.rows };
      }),
    );

    res.json({ questions, type });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/complete", async (req, res) => {
  try {
    const { revision_type, questions_attempted, score_percentage } = req.body;
    await db.query(
      `INSERT INTO revision_history (revision_type, questions_attempted, score_percentage)
       VALUES ($1, $2, $3)`,
      [revision_type, questions_attempted, score_percentage],
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/history", async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM revision_history ORDER BY completed_at DESC LIMIT 20",
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
