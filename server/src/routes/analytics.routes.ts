import { Router } from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/dashboard', (_req, res) => {
  const totalQuestions = (
    db.prepare('SELECT COUNT(*) as c FROM questions').get() as { c: number }
  ).c;
  const totalSections = (
    db.prepare('SELECT COUNT(*) as c FROM sections').get() as { c: number }
  ).c;
  const totalTopics = (db.prepare('SELECT COUNT(*) as c FROM topics').get() as { c: number }).c;
  const bookmarked = (
    db.prepare('SELECT COUNT(*) as c FROM bookmarks').get() as { c: number }
  ).c;

  const attempted = (
    db.prepare('SELECT COUNT(DISTINCT question_id) as c FROM user_answers').get() as {
      c: number;
    }
  ).c;

  const accuracyRow = db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
       FROM user_answers WHERE selected_option IS NOT NULL AND selected_option != ''`
    )
    .get() as { total: number; correct: number };

  const accuracy =
    accuracyRow.total > 0
      ? Math.round((accuracyRow.correct / accuracyRow.total) * 10000) / 100
      : 0;

  const recentQuizzes = db
    .prepare('SELECT * FROM quiz_results ORDER BY completed_at DESC LIMIT 5')
    .all();

  res.json({
    totalQuestions,
    totalSections,
    totalTopics,
    questionsAttempted: attempted,
    accuracyPercentage: accuracy,
    bookmarkedQuestions: bookmarked,
    recentQuizzes,
  });
});

router.get('/sections', (_req, res) => {
  const data = db
    .prepare(
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
       ORDER BY s.section_name`
    )
    .all();

  const withPct = (data as { total_answered: number; correct: number }[]).map((row) => ({
    ...row,
    accuracy:
      row.total_answered > 0
        ? Math.round((row.correct / row.total_answered) * 10000) / 100
        : null,
  }));

  res.json(withPct);
});

router.get('/topics', (req, res) => {
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
  const params: number[] = [];

  if (section_id) {
    sql += ' WHERE s.id = ?';
    params.push(Number(section_id));
  }
  sql += ' GROUP BY t.id HAVING total_answered > 0 ORDER BY correct * 1.0 / total_answered DESC';

  const rows = db.prepare(sql).all(...params);

  const withPct = (rows as { total_answered: number; correct: number }[]).map((row) => ({
    ...row,
    accuracy:
      row.total_answered > 0
        ? Math.round((row.correct / row.total_answered) * 10000) / 100
        : null,
  }));

  res.json(withPct);
});

router.get('/trends', (_req, res) => {
  const trends = db
    .prepare(
      `SELECT id, score_percentage, total_questions, completed_at
       FROM quiz_results ORDER BY completed_at ASC LIMIT 30`
    )
    .all();
  res.json(trends);
});

export default router;
