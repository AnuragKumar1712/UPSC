import { db } from '../db/connection.js';
import { addToAnswerPool, generateDistractors, shuffleOptions } from './answerPool.js';

export interface QuestionInput {
  topic_id: number;
  question_text: string;
  correct_answer: string;
  difficulty_level?: string;
  tags?: string;
  options?: string[];
  smart_mode?: boolean;
}

export function createQuestionWithOptions(input: QuestionInput) {
  const {
    topic_id,
    question_text,
    correct_answer,
    difficulty_level = 'Medium',
    tags = '',
    smart_mode = false,
  } = input;

  let optionTexts: string[];
  if (input.options && input.options.length === 4) {
    optionTexts = shuffleOptions(input.options);
  } else if (smart_mode) {
    const distractors = generateDistractors(correct_answer, 3);
    optionTexts = shuffleOptions([correct_answer, ...distractors]);
  } else {
    throw new Error('Four options required for manual mode');
  }

  const unique = new Set(optionTexts.map((o) => o.trim()));
  if (unique.size !== 4) {
    throw new Error('Options must be unique');
  }
  if (!optionTexts.includes(correct_answer.trim())) {
    throw new Error('Correct answer must be one of the options');
  }

  addToAnswerPool(correct_answer);
  for (const opt of optionTexts) {
    addToAnswerPool(opt);
  }

  const result = db
    .prepare(
      `INSERT INTO questions (topic_id, question_text, correct_answer, difficulty_level, tags)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(topic_id, question_text.trim(), correct_answer.trim(), difficulty_level, tags);

  const questionId = result.lastInsertRowid as number;
  const insertOpt = db.prepare(
    'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)'
  );

  for (const opt of optionTexts) {
    insertOpt.run(questionId, opt.trim(), opt.trim() === correct_answer.trim() ? 1 : 0);
  }

  return getQuestionById(questionId);
}

export function getQuestionById(id: number) {
  const question = db
    .prepare(
      `SELECT q.*, t.topic_name, s.section_name, s.id as section_id
       FROM questions q
       JOIN topics t ON q.topic_id = t.id
       JOIN sections s ON t.section_id = s.id
       WHERE q.id = ?`
    )
    .get(id);

  if (!question) return null;

  const options = db
    .prepare('SELECT * FROM options WHERE question_id = ? ORDER BY id')
    .all(id);

  const bookmarked = db
    .prepare('SELECT 1 FROM bookmarks WHERE question_id = ?')
    .get(id);

  return { ...question, options, bookmarked: !!bookmarked };
}

export function deleteQuestion(id: number) {
  db.prepare('DELETE FROM questions WHERE id = ?').run(id);
}
