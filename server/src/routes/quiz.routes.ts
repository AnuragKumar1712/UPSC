import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/generate", async (req, res) => {
  try {
    const { section_id, topic_id, difficulty, count = 10 } = req.body;
    const limit = Math.min(Math.max(1, Number(count)), 200);

    let sql = `SELECT q.id FROM questions q
      JOIN topics t ON q.topic_id = t.id
      JOIN sections s ON t.section_id = s.id WHERE 1=1`;
    const params: (string | number)[] = [];
    let paramCount = 1;

    if (section_id) {
      sql += ` AND s.id = $${paramCount++}`;
      params.push(Number(section_id));
    }
    if (topic_id) {
      sql += ` AND q.topic_id = $${paramCount++}`;
      params.push(Number(topic_id));
    }
    if (difficulty) {
      sql += ` AND q.difficulty_level = $${paramCount++}`;
      params.push(String(difficulty));
    }

    sql += ` ORDER BY RANDOM() LIMIT $${paramCount++}`;
    params.push(limit);

    const idsResult = await db.query(sql, params);
    const ids = idsResult.rows as { id: number }[];

    if (ids.length === 0) {
      return res.status(400).json({ error: "No questions match the criteria" });
    }

    const questions = await Promise.all(
      ids.map(async (row) => {
        const qResult = await db.query(
          `SELECT q.id, q.question_text, q.difficulty_level, q.tags,
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

    res.json({ questions, total: questions.length });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/submit", async (req, res) => {
  try {
    const { answers, filters = {} } = req.body;
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Answers required" });
    }

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    const details = [];

    for (const a of answers) {
      const qResult = await db.query(
        "SELECT correct_answer FROM questions WHERE id = $1",
        [a.question_id],
      );
      const q = qResult.rows[0] as { correct_answer: string } | undefined;

      if (!q) continue;

      const selected = a.selected_option?.trim() || null;
      const isCorrect = selected === q.correct_answer;
      if (!selected) unattempted++;
      else if (isCorrect) correct++;
      else wrong++;

      details.push({
        question_id: a.question_id,
        selected_option: selected,
        correct_option: q.correct_answer,
        is_correct: isCorrect ? 1 : 0,
      });
    }

    const total = answers.length;
    const scorePct =
      total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;

    const resultData = await db.query(
      `INSERT INTO quiz_results
       (score_percentage, total_questions, correct_answers, wrong_answers, unattempted,
        section_filter, topic_filter, difficulty_filter)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        scorePct,
        total,
        correct,
        wrong,
        unattempted,
        filters.section || "",
        filters.topic || "",
        filters.difficulty || "",
      ],
    );

    const quizId = resultData.rows[0].id;

    for (const d of details) {
      await db.query(
        `INSERT INTO user_answers (quiz_result_id, question_id, selected_option, correct_option, is_correct)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          quizId,
          d.question_id,
          d.selected_option,
          d.correct_option,
          d.is_correct,
        ],
      );
    }

    res.json({
      quiz_result_id: quizId,
      total_questions: total,
      correct_answers: correct,
      wrong_answers: wrong,
      unattempted,
      score_percentage: scorePct,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/results", async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM quiz_results ORDER BY completed_at DESC LIMIT 50",
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/results/:id", async (req, res) => {
  try {
    const resultData = await db.query(
      "SELECT * FROM quiz_results WHERE id = $1",
      [req.params.id],
    );
    const result = resultData.rows[0];

    if (!result) return res.status(404).json({ error: "Not found" });

    const answersResult = await db.query(
      `SELECT ua.*, q.question_text, q.tags, t.topic_name, s.section_name
       FROM user_answers ua
       JOIN questions q ON ua.question_id = q.id
       JOIN topics t ON q.topic_id = t.id
       JOIN sections s ON t.section_id = s.id
       WHERE ua.quiz_result_id = $1`,
      [req.params.id],
    );

    res.json({ ...result, answers: answersResult.rows });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
