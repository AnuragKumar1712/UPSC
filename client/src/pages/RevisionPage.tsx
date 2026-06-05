import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, QuizQuestion } from "../services/api";

const TYPES = [
  { id: "wrong", label: "Wrong Questions" },
  { id: "bookmarked", label: "Bookmarked" },
  { id: "weak", label: "Weak Topics" },
  { id: "recent", label: "Recently Added" },
  { id: "random", label: "Random Revision" },
];

export default function RevisionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [type, setType] = useState(searchParams.get("type") || "wrong");
  const [limit, setLimit] = useState(20);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);

  const load = () => {
    api.getRevisionQuestions(type, limit).then((res) => {
      setQuestions(res.questions);
      setCurrent(0);
      setAnswers({});
      setDone(false);
    });
  };

  useEffect(() => {
    load();
  }, [type, limit]);

  const q = questions[current];

  const finish = async () => {
    let correct = 0;
    for (const question of questions) {
      const selected = answers[question.id];
      if (
        selected &&
        question.correct_answer &&
        selected === question.correct_answer
      )
        correct++;
    }
    const pct = questions.length
      ? Math.round((correct / questions.length) * 100)
      : 0;
    setScore(pct);
    setDone(true);
    await api.completeRevision({
      revision_type: type,
      questions_attempted: questions.length,
      score_percentage: pct,
    });
  };

  if (questions.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-upsc-navy">Revision Mode</h2>
        <p className="mt-4 text-gray-500">
          No questions available for this revision type.
        </p>
        <select
          className="mt-4 border rounded-lg px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-upsc-navy">Revision Complete</h2>
        <p className="mt-4 text-xl">Score: {score}%</p>
        <button
          onClick={load}
          className="mt-4 px-4 py-2 bg-upsc-navy text-white rounded-lg"
        >
          Try Again
        </button>
        <button
          onClick={() => navigate("/")}
          className="mt-4 ml-2 px-4 py-2 border rounded-lg"
        >
          Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-upsc-navy">Revision Mode</h2>

      <div className="mt-4 flex gap-2 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`px-3 py-1 rounded text-sm ${
              type === t.id ? "bg-upsc-navy text-white" : "border"
            }`}
          >
            {t.label}
          </button>
        ))}
        <input
          type="number"
          min={5}
          max={50}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-20 border rounded px-2 text-sm"
        />
      </div>

      {q && (
        <div className="mt-6 bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-400">
            {current + 1} / {questions.length}
          </p>
          <p className="mt-2 text-lg font-medium whitespace-pre-wrap break-words">
            {q.question_text}
          </p>
          <div className="mt-4 space-y-2">
            {q.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() =>
                  setAnswers({ ...answers, [q.id]: opt.option_text })
                }
                className={`w-full text-left px-4 py-2 rounded border ${
                  answers[q.id] === opt.option_text
                    ? "border-upsc-navy bg-upsc-navy/5"
                    : ""
                }`}
              >
                <span className="whitespace-pre-wrap break-words">
                  {opt.option_text}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <button
              disabled={current === 0}
              onClick={() => setCurrent((c) => c - 1)}
              className="px-4 py-2 border rounded disabled:opacity-40"
            >
              Previous
            </button>
            {current < questions.length - 1 ? (
              <button
                onClick={() => setCurrent((c) => c + 1)}
                className="px-4 py-2 bg-upsc-navy text-white rounded"
              >
                Next
              </button>
            ) : (
              <button
                onClick={finish}
                className="px-4 py-2 bg-upsc-gold rounded font-medium"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
