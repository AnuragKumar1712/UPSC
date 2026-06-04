import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { api, QuizResultSummary } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.getDashboard().then(setStats).catch(console.error);
  }, []);

  if (!stats) return <p>Loading dashboard...</p>;

  const recent = (stats.recentQuizzes as QuizResultSummary[]) || [];

  return (
    <div>
      <h2 className="text-2xl font-bold text-upsc-navy">Dashboard</h2>
      <p className="text-gray-500 mt-1">Your UPSC preparation overview</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
        <StatCard label="Total Questions" value={stats.totalQuestions as number} />
        <StatCard label="Sections" value={stats.totalSections as number} />
        <StatCard label="Topics" value={stats.totalTopics as number} />
        <StatCard label="Attempted" value={stats.questionsAttempted as number} />
        <StatCard label="Accuracy" value={`${stats.accuracyPercentage}%`} />
        <StatCard label="Bookmarked" value={stats.bookmarkedQuestions as number} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/builder"
          className="px-4 py-2 bg-upsc-navy text-white rounded-lg text-sm font-medium"
        >
          Add Question
        </Link>
        <Link
          to="/quiz"
          className="px-4 py-2 bg-upsc-gold text-upsc-navy rounded-lg text-sm font-medium"
        >
          Start Quiz
        </Link>
        <Link
          to="/revision?type=wrong"
          className="px-4 py-2 border border-upsc-navy text-upsc-navy rounded-lg text-sm"
        >
          Review Mistakes
        </Link>
        <Link
          to="/analytics"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          View Analytics
        </Link>
      </div>

      <div className="mt-8 bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-upsc-navy">Recent Quiz Activity</h3>
        {recent.length === 0 ? (
          <p className="text-gray-400 text-sm mt-2">No quizzes yet. Start your first quiz!</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((q) => (
              <li key={q.id} className="flex justify-between text-sm border-b pb-2">
                <span>
                  {q.total_questions} questions — {q.score_percentage}% score
                </span>
                <Link to={`/results/${q.id}`} className="text-upsc-navy hover:underline">
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
