import { Router } from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { getQuestionById } from '../services/questions.js';

const router = Router();
router.use(requireAuth);

router.get('/', (_req, res) => {
  const bookmarks = db
    .prepare(
      `SELECT b.*, q.question_text, q.correct_answer, q.difficulty_level,
        t.topic_name, s.section_name
       FROM bookmarks b
       JOIN questions q ON b.question_id = q.id
       JOIN topics t ON q.topic_id = t.id
       JOIN sections s ON t.section_id = s.id
       ORDER BY b.bookmarked_at DESC`
    )
    .all();
  res.json(bookmarks);
});

router.post('/:questionId', (req, res) => {
  const questionId = Number(req.params.questionId);
  const q = getQuestionById(questionId);
  if (!q) return res.status(404).json({ error: 'Question not found' });

  try {
    db.prepare('INSERT INTO bookmarks (question_id) VALUES (?)').run(questionId);
  } catch {
    return res.status(409).json({ error: 'Already bookmarked' });
  }
  res.status(201).json({ ok: true });
});

router.delete('/:questionId', (req, res) => {
  db.prepare('DELETE FROM bookmarks WHERE question_id = ?').run(Number(req.params.questionId));
  res.json({ ok: true });
});

export default router;
