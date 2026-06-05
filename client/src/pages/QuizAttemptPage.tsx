import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, QuizQuestion } from "../services/api";

export default function QuizAttemptPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("activeQuiz");
    if (!raw) {
      navigate("/quiz");
      return;
    }
    const data = JSON.parse(raw);
    setQuestions(data.questions);
    setFilters(data.filters || {});
    setTimerEnabled(data.timer);
  }, [navigate]);

  useEffect(() => {
    if (!timerEnabled) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timerEnabled]);

  const q = questions[current];
  if (!q) return <p className="p-6">Loading quiz...</p>;

  const selectAnswer = (option: string) => {
    setAnswers({ ...answers, [q.id]: option });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = questions.map((question) => ({
      question_id: question.id,
      selected_option: answers[question.id] || null,
    }));
    try {
      const result = await api.submitQuiz({
        answers: payload,
        filters,
      });
      sessionStorage.removeItem("activeQuiz");
      navigate(`/results/${result.quiz_result_id}`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-upsc-navy">
          Question {current + 1} of {questions.length}
        </h2>
        {timerEnabled && (
          <span className="text-sm font-mono bg-white border px-3 py-1 rounded">
            {formatTime(elapsed)}
          </span>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-400">
            {q.section_name} · {q.topic_name}
          </p>
          <p className="mt-3 text-lg font-medium whitespace-pre-wrap break-words">
            {q.question_text}
          </p>

          <div className="mt-6 space-y-2">
            {q.options.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => selectAnswer(opt.option_text)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                  answers[q.id] === opt.option_text
                    ? "border-upsc-navy bg-upsc-navy/5"
                    : "hover:border-gray-400"
                }`}
              >
                <span className="font-medium mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                <span className="whitespace-pre-wrap break-words">
                  {opt.option_text}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              disabled={current === 0}
              onClick={() => setCurrent((c) => c - 1)}
              className="px-4 py-2 border rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setFlagged((f) => {
                  const n = new Set(f);
                  if (n.has(current)) n.delete(current);
                  else n.add(current);
                  return n;
                })
              }
              className="text-sm text-upsc-gold"
            >
              {flagged.has(current) ? "Unflag" : "Flag for review"}
            </button>
            {current < questions.length - 1 ? (
              <button
                onClick={() => setCurrent((c) => c + 1)}
                className="px-4 py-2 bg-upsc-navy text-white rounded-lg"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-upsc-gold text-upsc-navy font-semibold rounded-lg"
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            )}
          </div>
        </div>

        <div className="w-48 bg-white border rounded-lg p-3 h-fit">
          <p className="text-xs font-medium text-gray-500 mb-2">
            Question palette
          </p>
          <div className="grid grid-cols-5 gap-1">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-8 h-8 text-xs rounded ${
                  i === current
                    ? "bg-upsc-navy text-white"
                    : answers[questions[i].id]
                      ? "bg-green-100"
                      : flagged.has(i)
                        ? "bg-yellow-100"
                        : "bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="mt-4 w-full text-xs py-2 bg-upsc-gold rounded"
          >
            Submit early
          </button>
        </div>
      </div>
    </div>
  );
}
