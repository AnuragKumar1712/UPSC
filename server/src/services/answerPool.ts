import { db } from "../db/connection.js";

export async function addToAnswerPool(answer: string, category = "") {
  const trimmed = answer.trim();
  if (!trimmed) return;
  try {
    await db
      .prepare(
        "INSERT INTO answer_pool (answer_text, category) VALUES ($1, $2) ON CONFLICT (answer_text) DO NOTHING",
      )
      .run(trimmed, category);
  } catch {
    // ignore duplicates
  }
}

export async function generateDistractors(
  correctAnswer: string,
  count = 3,
): Promise<string[]> {
  const trimmed = correctAnswer.trim();
  const result = await db
    .prepare(
      `SELECT answer_text FROM answer_pool
       WHERE answer_text != $1
       ORDER BY RANDOM()
       LIMIT $2`,
    )
    .all(trimmed, count);

  const distractors = (result as { answer_text: string }[]).map(
    (r) => r.answer_text,
  );
  const fallback = [
    "Option B",
    "Option C",
    "Option D",
    "None of the above",
    "Not applicable",
  ];

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
