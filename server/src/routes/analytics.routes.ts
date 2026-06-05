import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/dashboard", async (_req, res) => {
  try {
    const totalQuestionsResult = await db.query(
      "SELECT COUNT(*) as c FROM questions",
    );
    const totalQuestions = totalQuestionsResult.rows[0].c;

    const totalSectionsResult = await db.query(
      "SELECT COUNT(*) as c FROM sections",
    );
    const totalSections = totalSectionsResult.rows[0].c;

    const totalTopicsResult = await db.query(
      "SELECT COUNT(*) as c FROM topics",
    );
    const totalTopics = totalTopicsResult.rows[0].c;

    const bookmarkedResult = await db.query(
      "SELECT COUNT(*) as c FROM bookmarks",
    );
    const bookmarked = bookmarkedResult.rows[0].c;

    const attemptedResult = await db.query(
      "SELECT COUNT(DISTINCT question_id) as c FROM user_answers",
    );
    const attempted = attemptedResult.rows[0].c;

    const accuracyResult = await db.query(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
       FROM user_answers WHERE selected_option IS NOT NULL AND selected_option != ''`,
    );
    const accuracyRow = accuracyResult.rows[0] as {
      total: number;
      correct: number;
    };

    const accuracy =
      accuracyRow.total > 0
        ? Math.round((accuracyRow.correct / accuracyRow.total) * 10000) / 100
        : 0;

    const recentQuizzesResult = await db.query(
      "SELECT * FROM quiz_results ORDER BY completed_at DESC LIMIT 5",
    );

    res.json({
      totalQuestions,
      totalSections,
      totalTopics,
      questionsAttempted: attempted,
      accuracyPercentage: accuracy,
      bookmarkedQuestions: bookmarked,
      recentQuizzes: recentQuizzesResult.rows,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/sections", async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.section_name,
        COUNT(DISTINCT ua.id) as attempts,
        SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
        COUNT(ua.id) as total_answered
       FROM sections s
       LEFT JOIN topics t ON t.section_id = s.id
       LEFT JOIN questions q ON q.topic_id = t.id
       LEFT JOIN user_answers ua ON ua.question_id = q.id
         AND ua.selected_option IS NOT NULL AND ua.selected_option != ''
       GROUP BY s.id
       ORDER BY s.section_name`,
    );
    const data = result.rows;

    const withPct = (data as { total_answered: number; correct: number }[]).map(
      (row) => ({
        ...row,
        accuracy:
          row.total_answered > 0
            ? Math.round((row.correct / row.total_answered) * 10000) / 100
            : null,
      }),
    );

    res.json(withPct);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/topics", async (req, res) => {
  try {
    const { section_id } = req.query;
    let sql = `SELECT t.id, t.topic_name, s.section_name,
      COUNT(DISTINCT ua.id) as attempts,
      SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
      COUNT(ua.id) as total_answered
      FROM topics t
      JOIN sections s ON t.section_id = s.id
      LEFT JOIN questions q ON q.topic_id = t.id
      LEFT JOIN user_answers ua ON ua.question_id = q.id
        AND ua.selected_option IS NOT NULL AND ua.selected_option != ''`;
    const params: (string | number)[] = [];
    let paramCount = 1;

    if (section_id) {
      sql += ` WHERE s.id = $${paramCount++}`;
      params.push(Number(section_id));
    }
    sql +=
      " GROUP BY t.id HAVING COUNT(ua.id) > 0 ORDER BY correct * 1.0 / COUNT(ua.id) DESC";

    const result = await db.query(sql, params);
    const rows = result.rows;

    const withPct = (rows as { total_answered: number; correct: number }[]).map(
      (row) => ({
        ...row,
        accuracy:
          row.total_answered > 0
            ? Math.round((row.correct / row.total_answered) * 10000) / 100
            : null,
      }),
    );

    res.json(withPct);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/trends", async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id, score_percentage, total_questions, completed_at
       FROM quiz_results ORDER BY completed_at ASC LIMIT 30`,
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
