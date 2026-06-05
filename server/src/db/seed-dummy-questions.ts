import dotenv from "dotenv";
import { db } from "./connection.js";
import { initDatabase } from "./init.js";
import { createQuestionWithOptions } from "../services/questions.js";

dotenv.config();

async function seed() {
  try {
    await initDatabase();

    const countResult = await db.query("SELECT COUNT(*) as c FROM questions");
    const existingCount = parseInt(countResult.rows[0].c, 10);

    if (existingCount >= 10 && process.env.FORCE_DUMMY_SEED !== "true") {
      console.log(
        `Database already has ${existingCount} questions. Set FORCE_DUMMY_SEED=true to add another batch.`,
      );
      process.exit(0);
    }

    const DUMMY_QUESTIONS = [
      {
        section: "Environment",
        topic: "National Parks",
        question: "Kaziranga National Park is located in which state?",
        answer: "Assam",
        difficulty: "Easy",
        tags: "national-parks,environment",
      },
      {
        section: "Environment",
        topic: "National Parks",
        question: "Project Tiger was launched in which year?",
        answer: "1973",
        difficulty: "Medium",
        tags: "wildlife,environment",
      },
      {
        section: "Environment",
        topic: "Climate Change",
        question: "The Kyoto Protocol is associated with which issue?",
        answer: "Climate Change",
        difficulty: "Easy",
        tags: "climate,conventions",
      },
      {
        section: "Polity",
        topic: "Fundamental Rights",
        question:
          "Which Article of the Indian Constitution deals with Right to Equality?",
        answer: "Article 14",
        difficulty: "Medium",
        tags: "constitution,polity",
      },
      {
        section: "Polity",
        topic: "Parliament",
        question: "The Rajya Sabha is also known as the?",
        answer: "Council of States",
        difficulty: "Easy",
        tags: "parliament,polity",
      },
      {
        section: "Polity",
        topic: "Judiciary",
        question: "Who is the final interpreter of the Indian Constitution?",
        answer: "Supreme Court",
        difficulty: "Easy",
        tags: "judiciary,polity",
      },
      {
        section: "Geography",
        topic: "Rivers",
        question: "Which river is known as the Dakshin Ganga?",
        answer: "Godavari",
        difficulty: "Medium",
        tags: "rivers,geography",
      },
      {
        section: "Geography",
        topic: "Mountains",
        question: "Mount Everest is located in which mountain range?",
        answer: "Himalayas",
        difficulty: "Easy",
        tags: "mountains,geography",
      },
      {
        section: "Modern History",
        topic: "Freedom Movement",
        question: "Who is known as the Father of the Nation in India?",
        answer: "Mahatma Gandhi",
        difficulty: "Easy",
        tags: "freedom-movement,history",
      },
      {
        section: "Science & Technology",
        topic: "Space",
        question: "Which organization launched the Chandrayaan-3 mission?",
        answer: "ISRO",
        difficulty: "Easy",
        tags: "space,science",
      },
    ];

    async function getOrCreateTopic(
      sectionName: string,
      topicName: string,
    ): Promise<number> {
      const sectionResult = await db.query(
        "SELECT id FROM sections WHERE section_name = $1",
        [sectionName],
      );
      const section = sectionResult.rows[0];

      if (!section) {
        throw new Error(`Section not found: ${sectionName}`);
      }

      const existingResult = await db.query(
        "SELECT id FROM topics WHERE section_id = $1 AND topic_name = $2",
        [section.id, topicName],
      );
      const existing = existingResult.rows[0];

      if (existing) return existing.id;

      const result = await db.query(
        "INSERT INTO topics (section_id, topic_name) VALUES ($1, $2) RETURNING id",
        [section.id, topicName],
      );

      return result.rows[0].id;
    }

    let created = 0;
    for (const item of DUMMY_QUESTIONS) {
      const topicId = await getOrCreateTopic(item.section, item.topic);
      await createQuestionWithOptions({
        topic_id: topicId,
        question_text: item.question,
        correct_answer: item.answer,
        difficulty_level: item.difficulty,
        tags: item.tags,
        smart_mode: true,
      });
      created++;
    }

    const totalResult = await db.query("SELECT COUNT(*) as c FROM questions");
    const total = parseInt(totalResult.rows[0].c, 10);
    console.log(
      `Added ${created} dummy questions. Total questions in DB: ${total}`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
