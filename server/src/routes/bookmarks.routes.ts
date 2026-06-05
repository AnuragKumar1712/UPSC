import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { getQuestionById } from "../services/questions.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, q.question_text, q.correct_answer, q.difficulty_level,
        t.topic_name, s.section_name
       FROM bookmarks b
       JOIN questions q ON b.question_id = q.id
       JOIN topics t ON q.topic_id = t.id
       JOIN sections s ON t.section_id = s.id
       ORDER BY b.bookmarked_at DESC`,
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/:questionId", async (req, res) => {
  try {
    const questionId = Number(req.params.questionId);
    const q = await getQuestionById(questionId);
    if (!q) return res.status(404).json({ error: "Question not found" });

    try {
      await db.query(
        "INSERT INTO bookmarks (question_id) VALUES ($1) ON CONFLICT (question_id) DO NOTHING RETURNING *",
        [questionId],
      );
      res.status(201).json({ ok: true });
    } catch {
      return res.status(409).json({ error: "Already bookmarked" });
    }
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.delete("/:questionId", async (req, res) => {
  try {
    await db.query("DELETE FROM bookmarks WHERE question_id = $1", [
      Number(req.params.questionId),
    ]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
