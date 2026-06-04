import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function AnalyticsPage() {
  const [sections, setSections] = useState<Record<string, unknown>[]>([]);
  const [topics, setTopics] = useState<Record<string, unknown>[]>([]);
  const [trends, setTrends] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    api.getSectionAnalytics().then((d) => setSections(d as Record<string, unknown>[]));
    api.getTopicAnalytics().then((d) => setTopics(d as Record<string, unknown>[]));
    api.getTrends().then((d) => setTrends(d as Record<string, unknown>[]));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-upsc-navy">Analytics Dashboard</h2>

      <div className="mt-6">
        <h3 className="font-semibold">Section Performance</h3>
        <div className="mt-3 grid gap-2">
          {sections.map((s) => (
            <div key={s.id as number} className="bg-white border rounded-lg p-3 flex justify-between">
              <span>{s.section_name as string}</span>
              <span className="font-medium">
                {s.accuracy != null ? `${s.accuracy}%` : 'No attempts yet'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold">Topic Performance (attempted)</h3>
        <div className="mt-3 grid gap-2 max-h-64 overflow-y-auto">
          {topics.length === 0 ? (
            <p className="text-gray-400 text-sm">Complete quizzes to see topic stats</p>
          ) : (
            topics.map((t) => (
              <div key={t.id as number} className="bg-white border rounded-lg p-3 flex justify-between text-sm">
                <span>
                  {t.topic_name as string}{' '}
                  <span className="text-gray-400">({t.section_name as string})</span>
                </span>
                <span className="font-medium">{t.accuracy as number}%</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold">Score Trend (last quizzes)</h3>
        <div className="mt-3 flex items-end gap-1 h-32">
          {trends.map((t) => (
            <div
              key={t.id as number}
              className="flex-1 bg-upsc-navy/80 rounded-t min-w-[8px]"
              style={{ height: `${Math.max(8, t.score_percentage as number)}%` }}
              title={`${t.score_percentage}%`}
            />
          ))}
        </div>
        {trends.length === 0 && (
          <p className="text-gray-400 text-sm">No quiz history yet</p>
        )}
      </div>
    </div>
  );
}
