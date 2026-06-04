import { Router } from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { createQuestionWithOptions, deleteQuestion, getQuestionById } from '../services/questions.js';
import { addToAnswerPool } from '../services/answerPool.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { section_id, topic_id, difficulty, tag, keyword, correct_answer } = req.query;

  let sql = `SELECT q.*, t.topic_name, s.section_name, s.id as section_id,
    (SELECT 1 FROM bookmarks b WHERE b.question_id = q.id) as is_bookmarked
    FROM questions q
    JOIN topics t ON q.topic_id = t.id
    JOIN sections s ON t.section_id = s.id WHERE 1=1`;
  const params: (string | number)[] = [];

  if (section_id) {
    sql += ' AND s.id = ?';
    params.push(Number(section_id));
  }
  if (topic_id) {
    sql += ' AND q.topic_id = ?';
    params.push(Number(topic_id));
  }
  if (difficulty) {
    sql += ' AND q.difficulty_level = ?';
    params.push(String(difficulty));
  }
  if (tag) {
    sql += ' AND q.tags LIKE ?';
    params.push(`%${tag}%`);
  }
  if (keyword) {
    sql += ' AND (q.question_text LIKE ? OR q.correct_answer LIKE ? OR q.tags LIKE ?)';
    const k = `%${keyword}%`;
    params.push(k, k, k);
  }
  if (correct_answer) {
    sql += ' AND q.correct_answer LIKE ?';
    params.push(`%${correct_answer}%`);
  }

  sql += ' ORDER BY q.updated_at DESC';
  const questions = db.prepare(sql).all(...params);

  const withOptions = questions.map((q) => {
    const options = db
      .prepare('SELECT id, option_text, is_correct FROM options WHERE question_id = ?')
      .all((q as { id: number }).id);
    return { ...q, options };
  });

  res.json(withOptions);
});

router.get('/:id', (req, res) => {
  const q = getQuestionById(Number(req.params.id));
  if (!q) return res.status(404).json({ error: 'Not found' });
  res.json(q);
});

router.post('/', (req, res) => {
  try {
    const question = createQuestionWithOptions(req.body);
    res.status(201).json(question);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = getQuestionById(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const {
    topic_id,
    question_text,
    correct_answer,
    difficulty_level,
    tags,
    options,
  } = req.body;

  db.prepare(
    `UPDATE questions SET topic_id = ?, question_text = ?, correct_answer = ?,
     difficulty_level = ?, tags = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    topic_id ?? existing.topic_id,
    (question_text ?? existing.question_text).trim(),
    (correct_answer ?? existing.correct_answer).trim(),
    difficulty_level ?? existing.difficulty_level,
    tags ?? existing.tags,
    id
  );

  addToAnswerPool(correct_answer ?? existing.correct_answer);

  if (options && Array.isArray(options) && options.length === 4) {
    db.prepare('DELETE FROM options WHERE question_id = ?').run(id);
    const insertOpt = db.prepare(
      'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)'
    );
    const ca = (correct_answer ?? existing.correct_answer).trim();
    for (const opt of options) {
      insertOpt.run(id, opt.trim(), opt.trim() === ca ? 1 : 0);
      addToAnswerPool(opt);
    }
  }

  res.json(getQuestionById(id));
});

router.delete('/:id', (req, res) => {
  deleteQuestion(Number(req.params.id));
  res.json({ ok: true });
});

router.post('/:id/duplicate', (req, res) => {
  const q = getQuestionById(Number(req.params.id));
  if (!q) return res.status(404).json({ error: 'Not found' });

  const options = (q.options as { option_text: string }[]).map((o) => o.option_text);
  const copy = createQuestionWithOptions({
    topic_id: q.topic_id as number,
    question_text: `${q.question_text} (copy)`,
    correct_answer: q.correct_answer as string,
    difficulty_level: q.difficulty_level as string,
    tags: q.tags as string,
    options,
  });
  res.status(201).json(copy);
});

router.post('/bulk', (req, res) => {
  const { topic_id, questions, smart_mode = true } = req.body;
  if (!topic_id || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'topic_id and questions array required' });
  }

  const created = [];
  const errors = [];

  for (const item of questions) {
    try {
      const q = createQuestionWithOptions({
        topic_id,
        question_text: item.question,
        correct_answer: item.answer,
        difficulty_level: item.difficulty || 'Medium',
        tags: item.tags || '',
        smart_mode,
      });
      created.push(q);
    } catch (e) {
      errors.push({ item, error: (e as Error).message });
    }
  }

  res.status(201).json({ created: created.length, errors, questions: created });
});

export default router;
