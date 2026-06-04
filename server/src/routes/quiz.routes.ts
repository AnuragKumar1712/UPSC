import { Router } from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/generate', (req, res) => {
  const { section_id, topic_id, difficulty, count = 10 } = req.body;
  const limit = Math.min(Math.max(1, Number(count)), 200);

  let sql = `SELECT q.id FROM questions q
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

  sql += ' ORDER BY RANDOM() LIMIT ?';
  params.push(limit);

  const ids = db.prepare(sql).all(...params) as { id: number }[];

  if (ids.length === 0) {
    return res.status(400).json({ error: 'No questions match the criteria' });
  }

  const questions = ids.map((row) => {
    const q = db
      .prepare(
        `SELECT q.id, q.question_text, q.difficulty_level, q.tags,
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

  res.json({ questions, total: questions.length });
});

router.post('/submit', (req, res) => {
  const { answers, filters = {} } = req.body;
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Answers required' });
  }

  let correct = 0;
  let wrong = 0;
  let unattempted = 0;
  const details = [];

  for (const a of answers) {
    const q = db
      .prepare('SELECT correct_answer FROM questions WHERE id = ?')
      .get(a.question_id) as { correct_answer: string } | undefined;

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
  const scorePct = total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;

  const result = db
    .prepare(
      `INSERT INTO quiz_results
       (score_percentage, total_questions, correct_answers, wrong_answers, unattempted,
        section_filter, topic_filter, difficulty_filter)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      scorePct,
      total,
      correct,
      wrong,
      unattempted,
      filters.section || '',
      filters.topic || '',
      filters.difficulty || ''
    );

  const quizId = result.lastInsertRowid as number;
  const insertAnswer = db.prepare(
    `INSERT INTO user_answers (quiz_result_id, question_id, selected_option, correct_option, is_correct)
     VALUES (?, ?, ?, ?, ?)`
  );

  for (const d of details) {
    insertAnswer.run(
      quizId,
      d.question_id,
      d.selected_option,
      d.correct_option,
      d.is_correct
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
});

router.get('/results', (_req, res) => {
  const results = db
    .prepare('SELECT * FROM quiz_results ORDER BY completed_at DESC LIMIT 50')
    .all();
  res.json(results);
});

router.get('/results/:id', (req, res) => {
  const result = db
    .prepare('SELECT * FROM quiz_results WHERE id = ?')
    .get(req.params.id);

  if (!result) return res.status(404).json({ error: 'Not found' });

  const answers = db
    .prepare(
      `SELECT ua.*, q.question_text, q.tags, t.topic_name, s.section_name
       FROM user_answers ua
       JOIN questions q ON ua.question_id = q.id
       JOIN topics t ON q.topic_id = t.id
       JOIN sections s ON t.section_id = s.id
       WHERE ua.quiz_result_id = ?`
    )
    .all(req.params.id);

  res.json({ ...result, answers });
});

export default router;
