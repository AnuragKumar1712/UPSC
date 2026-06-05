import { Router } from "express";
import fs from "fs";
import path from "path";
import { Parser } from "json2csv";
import * as XLSX from "xlsx";
import { db, getDbPath } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { createQuestionWithOptions } from "../services/questions.js";

const router = Router();
router.use(requireAuth);

router.get("/export/db", (_req, res) => {
  try {
    const dbPath = getDbPath();
    res.download(dbPath, "upsc.db");
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/backup", (_req, res) => {
  try {
    const dbPath = getDbPath();
    const backupDir = path.join(path.dirname(dbPath), "backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "_");
    const backupPath = path.join(backupDir, `backup_${date}.db`);
    fs.copyFileSync(dbPath, backupPath);
    res.json({ path: backupPath, filename: path.basename(backupPath) });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/export/questions", async (req, res) => {
  try {
    const format = (req.query.format as string) || "json";
    const result = await db.query(
      `SELECT q.question_text, q.correct_answer, q.difficulty_level, q.tags,
        t.topic_name, s.section_name
       FROM questions q
       JOIN topics t ON q.topic_id = t.id
       JOIN sections s ON t.section_id = s.id
       ORDER BY s.section_name, t.topic_name`,
    );
    const rows = result.rows;

    if (format === "csv") {
      const parser = new Parser({
        fields: [
          "section_name",
          "topic_name",
          "question_text",
          "correct_answer",
          "difficulty_level",
          "tags",
        ],
      });
      res.header("Content-Type", "text/csv");
      res.header("Content-Disposition", "attachment; filename=questions.csv");
      return res.send(parser.parse(rows));
    }

    if (format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Questions");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.header("Content-Disposition", "attachment; filename=questions.xlsx");
      return res.send(buf);
    }

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/import", async (req, res) => {
  try {
    const { questions, topic_id, smart_mode = true } = req.body;
    if (!topic_id || !Array.isArray(questions)) {
      return res.status(400).json({ error: "topic_id and questions required" });
    }

    let imported = 0;
    const errors: string[] = [];

    for (const item of questions) {
      try {
        await createQuestionWithOptions({
          topic_id,
          question_text: item.question_text || item.question,
          correct_answer: item.correct_answer || item.answer,
          difficulty_level:
            item.difficulty_level || item.difficulty || "Medium",
          tags: item.tags || "",
          smart_mode,
        });
        imported++;
      } catch (e) {
        errors.push((e as Error).message);
      }
    }

    res.json({ imported, errors });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/answer-pool", async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM answer_pool ORDER BY answer_text",
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
