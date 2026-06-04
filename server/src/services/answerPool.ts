import { db } from '../db/connection.js';

export function addToAnswerPool(answer: string, category = '') {
  const trimmed = answer.trim();
  if (!trimmed) return;
  try {
    db.prepare(
      'INSERT OR IGNORE INTO answer_pool (answer_text, category) VALUES (?, ?)'
    ).run(trimmed, category);
  } catch {
    // ignore duplicates
  }
}

export function generateDistractors(correctAnswer: string, count = 3): string[] {
  const trimmed = correctAnswer.trim();
  const rows = db
    .prepare(
      `SELECT answer_text FROM answer_pool
       WHERE answer_text != ?
       ORDER BY RANDOM()
       LIMIT ?`
    )
    .all(trimmed, count) as { answer_text: string }[];

  const distractors = rows.map((r) => r.answer_text);
  const fallback = ['Option B', 'Option C', 'Option D', 'None of the above', 'Not applicable'];

  let i = 0;
  while (distractors.length < count && i < fallback.length) {
    const f = fallback[i++];
    if (f !== trimmed && !distractors.includes(f)) {
      distractors.push(f);
    }
  }

  return distractors.slice(0, count);
}

export function shuffleOptions(options: string[]): string[] {
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
