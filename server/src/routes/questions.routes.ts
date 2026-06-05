import { Router } from "express";
import { db } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createQuestionWithOptions,
  deleteQuestion,
  getQuestionById,
} from "../services/questions.js";
import { addToAnswerPool } from "../services/answerPool.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { section_id, topic_id, difficulty, tag, keyword, correct_answer } =
      req.query;

    let sql = `SELECT q.*, t.topic_name, s.section_name, s.id as section_id,
      (SELECT 1 FROM bookmarks b WHERE b.question_id = q.id) as is_bookmarked
      FROM questions q
      JOIN topics t ON q.topic_id = t.id
      JOIN sections s ON t.section_id = s.id WHERE 1=1`;
    const params: (string | number)[] = [];
    let paramCount = 1;

    if (section_id) {
      sql += ` AND s.id = $${paramCount++}`;
      params.push(Number(section_id));
    }
    if (topic_id) {
      sql += ` AND q.topic_id = $${paramCount++}`;
      params.push(Number(topic_id));
    }
    if (difficulty) {
      sql += ` AND q.difficulty_level = $${paramCount++}`;
      params.push(String(difficulty));
    }
    if (tag) {
      sql += ` AND q.tags ILIKE $${paramCount++}`;
      params.push(`%${tag}%`);
    }
    if (keyword) {
      sql += ` AND (q.question_text ILIKE $${paramCount++} OR q.correct_answer ILIKE $${paramCount++} OR q.tags ILIKE $${paramCount++})`;
      const k = `%${keyword}%`;
      params.push(k, k, k);
    }
    if (correct_answer) {
      sql += ` AND q.correct_answer ILIKE $${paramCount++}`;
      params.push(`%${correct_answer}%`);
    }

    sql += " ORDER BY q.updated_at DESC";
    const result = await db.query(sql, params);
    const questions = result.rows;

    const withOptions = await Promise.all(
      questions.map(async (q) => {
        const optResult = await db.query(
          "SELECT id, option_text, is_correct FROM options WHERE question_id = $1",
          [q.id],
        );
        return { ...q, options: optResult.rows };
      }),
    );

    res.json(withOptions);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const q = await getQuestionById(Number(req.params.id));
    if (!q) return res.status(404).json({ error: "Not found" });
    res.json(q);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/", async (req, res) => {
  try {
    const question = await createQuestionWithOptions(req.body);
    res.status(201).json(question);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await getQuestionById(id);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const {
      topic_id,
      question_text,
      correct_answer,
      difficulty_level,
      tags,
      options,
    } = req.body;

    await db.query(
      `UPDATE questions SET topic_id = $1, question_text = $2, correct_answer = $3,
       difficulty_level = $4, tags = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`,
      [
        topic_id ?? existing.topic_id,
        (question_text ?? existing.question_text).trim(),
        (correct_answer ?? existing.correct_answer).trim(),
        difficulty_level ?? existing.difficulty_level,
        tags ?? existing.tags,
        id,
      ],
    );

    await addToAnswerPool(correct_answer ?? existing.correct_answer);

    if (options && Array.isArray(options) && options.length === 4) {
      await db.query("DELETE FROM options WHERE question_id = $1", [id]);
      const ca = (correct_answer ?? existing.correct_answer).trim();
      for (const opt of options) {
        await db.query(
          "INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)",
          [id, opt.trim(), opt.trim() === ca ? 1 : 0],
        );
        await addToAnswerPool(opt);
      }
    }

    const updated = await getQuestionById(id);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteQuestion(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/:id/duplicate", async (req, res) => {
  try {
    const q = await getQuestionById(Number(req.params.id));
    if (!q) return res.status(404).json({ error: "Not found" });

    const optionsText = (q.options as { option_text: string }[]).map(
      (o) => o.option_text,
    );
    const copy = await createQuestionWithOptions({
      topic_id: q.topic_id as number,
      question_text: `${q.question_text} (copy)`,
      correct_answer: q.correct_answer as string,
      difficulty_level: q.difficulty_level as string,
      tags: q.tags as string,
      options: optionsText,
    });
    res.status(201).json(copy);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const { topic_id, questions, smart_mode = true } = req.body;
    if (!topic_id || !Array.isArray(questions)) {
      return res
        .status(400)
        .json({ error: "topic_id and questions array required" });
    }

    const created = [];
    const errors = [];

    for (const item of questions) {
      try {
        const q = await createQuestionWithOptions({
          topic_id,
          question_text: item.question,
          correct_answer: item.answer,
          difficulty_level: item.difficulty || "Medium",
          tags: item.tags || "",
          smart_mode,
        });
        created.push(q);
      } catch (e) {
        errors.push({ item, error: (e as Error).message });
      }
    }

    res
      .status(201)
      .json({ created: created.length, errors, questions: created });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
