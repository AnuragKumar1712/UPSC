import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';
import { db, getDbPath } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { createQuestionWithOptions } from '../services/questions.js';

const router = Router();
router.use(requireAuth);

router.get('/export/db', (_req, res) => {
  const dbPath = getDbPath();
  res.download(dbPath, 'upsc.db');
});

router.post('/backup', (_req, res) => {
  const dbPath = getDbPath();
  const backupDir = path.join(path.dirname(dbPath), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  const backupPath = path.join(backupDir, `backup_${date}.db`);
  fs.copyFileSync(dbPath, backupPath);
  res.json({ path: backupPath, filename: path.basename(backupPath) });
});

router.get('/export/questions', (req, res) => {
  const format = (req.query.format as string) || 'json';
  const rows = db
    .prepare(
      `SELECT q.question_text, q.correct_answer, q.difficulty_level, q.tags,
        t.topic_name, s.section_name
       FROM questions q
       JOIN topics t ON q.topic_id = t.id
       JOIN sections s ON t.section_id = s.id
       ORDER BY s.section_name, t.topic_name`
    )
    .all();

  if (format === 'csv') {
    const parser = new Parser({
      fields: ['section_name', 'topic_name', 'question_text', 'correct_answer', 'difficulty_level', 'tags'],
    });
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=questions.csv');
    return res.send(parser.parse(rows));
  }

  if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', 'attachment; filename=questions.xlsx');
    return res.send(buf);
  }

  res.json(rows);
});

router.post('/import', (req, res) => {
  const { questions, topic_id, smart_mode = true } = req.body;
  if (!topic_id || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'topic_id and questions required' });
  }

  let imported = 0;
  const errors: string[] = [];

  for (const item of questions) {
    try {
      createQuestionWithOptions({
        topic_id,
        question_text: item.question_text || item.question,
        correct_answer: item.correct_answer || item.answer,
        difficulty_level: item.difficulty_level || item.difficulty || 'Medium',
        tags: item.tags || '',
        smart_mode,
      });
      imported++;
    } catch (e) {
      errors.push((e as Error).message);
    }
  }

  res.json({ imported, errors });
});

router.get('/answer-pool', (_req, res) => {
  const pool = db.prepare('SELECT * FROM answer_pool ORDER BY answer_text').all();
  res.json(pool);
});

export default router;
