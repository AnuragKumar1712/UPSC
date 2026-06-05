import { db } from "./connection.js";

const DEFAULT_SECTIONS = [
  "Environment",
  "Modern History",
  "Ancient History",
  "Medieval History",
  "Polity",
  "Geography",
  "Economy",
  "Science & Technology",
  "International Relations",
  "Art & Culture",
  "Current Affairs",
  "Ethics",
  "Miscellaneous",
];

export async function initDatabase() {
  try {
    // Create extensions
    await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create tables
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        section_name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        section_id INTEGER NOT NULL,
        topic_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
        UNIQUE(section_id, topic_name)
      );

      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        difficulty_level TEXT DEFAULT 'Medium',
        tags TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS options (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL,
        option_text TEXT NOT NULL,
        is_correct INTEGER DEFAULT 0,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS answer_pool (
        id SERIAL PRIMARY KEY,
        answer_text TEXT NOT NULL UNIQUE,
        category TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quiz_results (
        id SERIAL PRIMARY KEY,
        score_percentage REAL NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        wrong_answers INTEGER NOT NULL,
        unattempted INTEGER DEFAULT 0,
        section_filter TEXT DEFAULT '',
        topic_filter TEXT DEFAULT '',
        difficulty_filter TEXT DEFAULT '',
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_answers (
        id SERIAL PRIMARY KEY,
        quiz_result_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        selected_option TEXT,
        correct_option TEXT NOT NULL,
        is_correct INTEGER DEFAULT 0,
        FOREIGN KEY (quiz_result_id) REFERENCES quiz_results(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL UNIQUE,
        bookmarked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS revision_history (
        id SERIAL PRIMARY KEY,
        revision_type TEXT NOT NULL,
        questions_attempted INTEGER NOT NULL,
        score_percentage REAL NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const statements = createTablesSQL.split(";").filter((s) => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
      }
    }

    // Check if sections already exist
    const result = await db.query("SELECT COUNT(*) as c FROM sections");
    const sectionCount = parseInt(result.rows[0].c, 10);

    if (sectionCount === 0) {
      const insert = db.prepare(
        "INSERT INTO sections (section_name) VALUES ($1)",
      );
      for (const name of DEFAULT_SECTIONS) {
        await insert.run(name);
      }
      console.log("Database initialized with default sections");
    } else {
      console.log("Database already initialized");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}
