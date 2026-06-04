import dotenv from 'dotenv';
import { db } from './connection.js';
import { initDatabase } from './init.js';
import { createQuestionWithOptions } from '../services/questions.js';

dotenv.config();
initDatabase();

const existingCount = (
  db.prepare('SELECT COUNT(*) as c FROM questions').get() as { c: number }
).c;

if (existingCount >= 10 && process.env.FORCE_DUMMY_SEED !== 'true') {
  console.log(
    `Database already has ${existingCount} questions. Set FORCE_DUMMY_SEED=true to add another batch.`
  );
  process.exit(0);
}

const DUMMY_QUESTIONS = [
  {
    section: 'Environment',
    topic: 'National Parks',
    question: 'Kaziranga National Park is located in which state?',
    answer: 'Assam',
    difficulty: 'Easy',
    tags: 'national-parks,environment',
  },
  {
    section: 'Environment',
    topic: 'National Parks',
    question: 'Project Tiger was launched in which year?',
    answer: '1973',
    difficulty: 'Medium',
    tags: 'wildlife,environment',
  },
  {
    section: 'Environment',
    topic: 'Climate Change',
    question: 'The Kyoto Protocol is associated with which issue?',
    answer: 'Climate Change',
    difficulty: 'Easy',
    tags: 'climate,conventions',
  },
  {
    section: 'Polity',
    topic: 'Fundamental Rights',
    question: 'Which Article of the Indian Constitution deals with Right to Equality?',
    answer: 'Article 14',
    difficulty: 'Medium',
    tags: 'constitution,polity',
  },
  {
    section: 'Polity',
    topic: 'Parliament',
    question: 'The Rajya Sabha is also known as the?',
    answer: 'Council of States',
    difficulty: 'Easy',
    tags: 'parliament,polity',
  },
  {
    section: 'Polity',
    topic: 'Judiciary',
    question: 'Who is the final interpreter of the Indian Constitution?',
    answer: 'Supreme Court',
    difficulty: 'Easy',
    tags: 'judiciary,polity',
  },
  {
    section: 'Geography',
    topic: 'Rivers',
    question: 'Which river is known as the Dakshin Ganga?',
    answer: 'Godavari',
    difficulty: 'Medium',
    tags: 'rivers,geography',
  },
  {
    section: 'Geography',
    topic: 'Mountains',
    question: 'Mount Everest is located in which mountain range?',
    answer: 'Himalayas',
    difficulty: 'Easy',
    tags: 'mountains,geography',
  },
  {
    section: 'Modern History',
    topic: 'Freedom Movement',
    question: 'Who is known as the Father of the Nation in India?',
    answer: 'Mahatma Gandhi',
    difficulty: 'Easy',
    tags: 'freedom-movement,history',
  },
  {
    section: 'Science & Technology',
    topic: 'Space',
    question: 'Which organization launched the Chandrayaan-3 mission?',
    answer: 'ISRO',
    difficulty: 'Easy',
    tags: 'space,science',
  },
];

function getOrCreateTopic(sectionName: string, topicName: string): number {
  const section = db
    .prepare('SELECT id FROM sections WHERE section_name = ?')
    .get(sectionName) as { id: number } | undefined;

  if (!section) {
    throw new Error(`Section not found: ${sectionName}`);
  }

  const existing = db
    .prepare('SELECT id FROM topics WHERE section_id = ? AND topic_name = ?')
    .get(section.id, topicName) as { id: number } | undefined;

  if (existing) return existing.id;

  const result = db
    .prepare('INSERT INTO topics (section_id, topic_name) VALUES (?, ?)')
    .run(section.id, topicName);

  return result.lastInsertRowid as number;
}

let created = 0;
for (const item of DUMMY_QUESTIONS) {
  const topicId = getOrCreateTopic(item.section, item.topic);
  createQuestionWithOptions({
    topic_id: topicId,
    question_text: item.question,
    correct_answer: item.answer,
    difficulty_level: item.difficulty,
    tags: item.tags,
    smart_mode: true,
  });
  created++;
}

const total = db.prepare('SELECT COUNT(*) as c FROM questions').get() as { c: number };
console.log(`Added ${created} dummy questions. Total questions in DB: ${total.c}`);
