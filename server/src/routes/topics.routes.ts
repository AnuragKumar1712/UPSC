import { Router } from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { section_id } = req.query;
  let sql = `SELECT t.*,
    (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id) as question_count,
    s.section_name
    FROM topics t JOIN sections s ON t.section_id = s.id`;
  const params: number[] = [];

  if (section_id) {
    sql += ' WHERE t.section_id = ?';
    params.push(Number(section_id));
  }
  sql += ' ORDER BY s.section_name, t.topic_name';

  const topics = db.prepare(sql).all(...params);
  res.json(topics);
});

router.post('/', (req, res) => {
  const { section_id, topic_name } = req.body;
  if (!section_id || !topic_name?.trim()) {
    return res.status(400).json({ error: 'section_id and topic_name required' });
  }
  try {
    const result = db
      .prepare('INSERT INTO topics (section_id, topic_name) VALUES (?, ?)')
      .run(section_id, topic_name.trim());
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(topic);
  } catch {
    res.status(409).json({ error: 'Topic already exists in this section' });
  }
});

router.put('/:id', (req, res) => {
  const { topic_name } = req.body;
  db.prepare(
    `UPDATE topics SET topic_name = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(topic_name?.trim(), req.params.id);
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
  res.json(topic);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM topics WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
