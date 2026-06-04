import { Router } from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/questions', (req, res) => {
  const { type = 'wrong', limit = 20 } = req.query;
  const max = Math.min(Number(limit) || 20, 100);
  let ids: { id: number }[] = [];

  switch (type) {
    case 'wrong':
      ids = db
        .prepare(
          `SELECT DISTINCT q.id FROM questions q
           JOIN user_answers ua ON ua.question_id = q.id
           WHERE ua.is_correct = 0 AND ua.selected_option IS NOT NULL
           ORDER BY RANDOM() LIMIT ?`
        )
        .all(max) as { id: number }[];
      break;
    case 'bookmarked':
      ids = db
        .prepare(
          `SELECT q.id FROM questions q
           JOIN bookmarks b ON b.question_id = q.id
           ORDER BY RANDOM() LIMIT ?`
        )
        .all(max) as { id: number }[];
      break;
    case 'weak':
      ids = db
        .prepare(
          `SELECT q.id FROM questions q
           JOIN user_answers ua ON ua.question_id = q.id
           GROUP BY q.id
           HAVING CAST(SUM(ua.is_correct) AS REAL) / COUNT(*) < 0.5
           ORDER BY RANDOM() LIMIT ?`
        )
        .all(max) as { id: number }[];
      break;
    case 'recent':
      ids = db
        .prepare('SELECT id FROM questions ORDER BY created_at DESC LIMIT ?')
        .all(max) as { id: number }[];
      break;
    case 'random':
    default:
      ids = db
        .prepare('SELECT id FROM questions ORDER BY RANDOM() LIMIT ?')
        .all(max) as { id: number }[];
  }

  const questions = ids.map((row) => {
    const q = db
      .prepare(
        `SELECT q.id, q.question_text, q.correct_answer, q.difficulty_level, q.tags,
          t.topic_name, s.section_name
         FROM questions q
         JOIN topics t ON q.topic_id = t.id
         JOIN sections s ON t.section_id = s.id
         WHERE q.id = ?`
      )
      .get(row.id);
    const options = db
      .prepare('SELECT id, option_text FROM options WHERE question_id = ? ORDER BY RANDOM()')
      .all(row.id);
    return { ...q, options };
  });

  res.json({ questions, type });
});

router.post('/complete', (req, res) => {
  const { revision_type, questions_attempted, score_percentage } = req.body;
  db.prepare(
    `INSERT INTO revision_history (revision_type, questions_attempted, score_percentage)
     VALUES (?, ?, ?)`
  ).run(revision_type, questions_attempted, score_percentage);
  res.json({ ok: true });
});

router.get('/history', (_req, res) => {
  const history = db
    .prepare('SELECT * FROM revision_history ORDER BY completed_at DESC LIMIT 20')
    .all();
  res.json(history);
});

export default router;
