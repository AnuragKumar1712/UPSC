import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function ResultsPage() {
  const { id } = useParams();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (id) api.getQuizResult(Number(id)).then((r) => setResult(r as Record<string, unknown>));
  }, [id]);

  if (!result) return <p>Loading results...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-upsc-navy">Quiz Results</h2>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-upsc-navy">{result.score_percentage as number}%</p>
          <p className="text-sm text-gray-500">Score</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold">{result.total_questions as number}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{result.correct_answers as number}</p>
          <p className="text-sm text-gray-500">Correct</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{result.wrong_answers as number}</p>
          <p className="text-sm text-gray-500">Wrong</p>
        </div>
      </div>

      {(result.unattempted as number) > 0 && (
        <p className="mt-4 text-sm text-gray-500">
          Unattempted: {result.unattempted as number}
        </p>
      )}

      <Link
        to={`/review/${id}`}
        className="inline-block mt-6 px-6 py-2 bg-upsc-navy text-white rounded-lg"
      >
        Review Answers
      </Link>
      <Link to="/quiz" className="inline-block mt-6 ml-3 px-6 py-2 border rounded-lg">
        New Quiz
      </Link>
    </div>
  );
}
