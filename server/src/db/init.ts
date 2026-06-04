import { db } from './connection.js';

const DEFAULT_SECTIONS = [
  'Environment',
  'Modern History',
  'Ancient History',
  'Medieval History',
  'Polity',
  'Geography',
  'Economy',
  'Science & Technology',
  'International Relations',
  'Art & Culture',
  'Current Affairs',
  'Ethics',
  'Miscellaneous',
];

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      topic_name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
      UNIQUE(section_id, topic_name)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      difficulty_level TEXT DEFAULT 'Medium',
      tags TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      is_correct INTEGER DEFAULT 0,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS answer_pool (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      answer_text TEXT NOT NULL UNIQUE,
      category TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quiz_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      score_percentage REAL NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      wrong_answers INTEGER NOT NULL,
      unattempted INTEGER DEFAULT 0,
      section_filter TEXT DEFAULT '',
      topic_filter TEXT DEFAULT '',
      difficulty_filter TEXT DEFAULT '',
      completed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_result_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      selected_option TEXT,
      correct_option TEXT NOT NULL,
      is_correct INTEGER DEFAULT 0,
      FOREIGN KEY (quiz_result_id) REFERENCES quiz_results(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL UNIQUE,
      bookmarked_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS revision_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      revision_type TEXT NOT NULL,
      questions_attempted INTEGER NOT NULL,
      score_percentage REAL NOT NULL,
      completed_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const sectionCount = db.prepare('SELECT COUNT(*) as c FROM sections').get() as { c: number };
  if (sectionCount.c === 0) {
    const insert = db.prepare('INSERT INTO sections (section_name) VALUES (?)');
    for (const name of DEFAULT_SECTIONS) {
      insert.run(name);
    }
  }
}
