import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";

interface AnswerRow {
  question_text: string;
  selected_option: string | null;
  correct_option: string;
  is_correct: number;
  section_name: string;
  topic_name: string;
}

export default function ReviewAnswersPage() {
  const { id } = useParams();
  const [answers, setAnswers] = useState<AnswerRow[]>([]);

  useEffect(() => {
    if (id) {
      api.getQuizResult(Number(id)).then((res) => {
        setAnswers((res as { answers: AnswerRow[] }).answers || []);
      });
    }
  }, [id]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-upsc-navy">Review Answers</h2>
      <p className="text-gray-500 mt-1">Analyze your mistakes</p>

      <div className="mt-6 space-y-4">
        {answers.map((a, i) => (
          <div
            key={i}
            className={`border rounded-lg p-4 ${
              a.is_correct
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <p className="text-xs text-gray-500">
              {a.section_name} · {a.topic_name}
            </p>
            <p className="font-medium mt-1 whitespace-pre-wrap break-words">
              {a.question_text}
            </p>
            <p className="text-sm mt-2 whitespace-pre-wrap break-words">
              Your answer: <strong>{a.selected_option || "(skipped)"}</strong>
            </p>
            {!a.is_correct && (
              <p className="text-sm text-green-800 whitespace-pre-wrap break-words">
                Correct: <strong>{a.correct_option}</strong>
              </p>
            )}
            <span
              className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
                a.is_correct
                  ? "bg-green-200 text-green-800"
                  : "bg-red-200 text-red-800"
              }`}
            >
              {a.is_correct ? "Correct" : "Incorrect"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
