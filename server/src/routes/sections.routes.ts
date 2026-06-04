import { Router } from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (_req, res) => {
  const sections = db
    .prepare(
      `SELECT s.*,
        (SELECT COUNT(*) FROM topics t WHERE t.section_id = s.id) as topic_count,
        (SELECT COUNT(*) FROM questions q
         JOIN topics t ON q.topic_id = t.id WHERE t.section_id = s.id) as question_count
       FROM sections s ORDER BY s.section_name`
    )
    .all();
  res.json(sections);
});

router.post('/', (req, res) => {
  const { section_name } = req.body;
  if (!section_name?.trim()) {
    return res.status(400).json({ error: 'Section name required' });
  }
  try {
    const result = db
      .prepare('INSERT INTO sections (section_name) VALUES (?)')
      .run(section_name.trim());
    const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(section);
  } catch {
    res.status(409).json({ error: 'Section already exists' });
  }
});

router.put('/:id', (req, res) => {
  const { section_name } = req.body;
  db.prepare(
    `UPDATE sections SET section_name = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(section_name?.trim(), req.params.id);
  const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(req.params.id);
  res.json(section);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sections WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
