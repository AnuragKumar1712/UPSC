import { useEffect, useState } from 'react';
import { api, Question, Section, Topic } from '../services/api';

export default function QuestionBankPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filters, setFilters] = useState({
    section_id: '',
    topic_id: '',
    difficulty: '',
    keyword: '',
    tag: '',
  });

  useEffect(() => {
    api.getSections().then(setSections);
  }, []);

  useEffect(() => {
    if (filters.section_id) {
      api.getTopics(Number(filters.section_id)).then(setTopics);
    } else setTopics([]);
  }, [filters.section_id]);

  const load = () => {
    const params: Record<string, string | number> = {};
    if (filters.section_id) params.section_id = filters.section_id;
    if (filters.topic_id) params.topic_id = filters.topic_id;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.tag) params.tag = filters.tag;
    api.getQuestions(params).then(setQuestions);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-upsc-navy">Question Bank</h2>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
        <select
          className="border rounded-lg px-3 py-2"
          value={filters.section_id}
          onChange={(e) =>
            setFilters({ ...filters, section_id: e.target.value, topic_id: '' })
          }
        >
          <option value="">All sections</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.section_name}
            </option>
          ))}
        </select>
        <select
          className="border rounded-lg px-3 py-2"
          value={filters.topic_id}
          onChange={(e) => setFilters({ ...filters, topic_id: e.target.value })}
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.topic_name}
            </option>
          ))}
        </select>
        <select
          className="border rounded-lg px-3 py-2"
          value={filters.difficulty}
          onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
        >
          <option value="">All difficulties</option>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Search keyword"
          value={filters.keyword}
          onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
        />
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Filter by tag"
          value={filters.tag}
          onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
        />
        <button onClick={load} className="bg-upsc-navy text-white rounded-lg px-4">
          Search
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-500">{questions.length} questions</p>

      <div className="mt-4 space-y-3">
        {questions.map((q) => (
          <div key={q.id} className="bg-white border rounded-lg p-4">
            <p className="font-medium">{q.question_text}</p>
            <p className="text-sm text-gray-500 mt-1">
              {q.section_name} → {q.topic_name} · {q.difficulty_level}
              {q.tags && ` · ${q.tags}`}
            </p>
            <p className="text-sm text-green-700 mt-1">Answer: {q.correct_answer}</p>
            {q.options && (
              <ul className="text-xs text-gray-400 mt-1">
                {q.options.map((o) => (
                  <li key={o.id}>
                    {o.option_text}
                    {o.is_correct ? ' ✓' : ''}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex gap-2 text-sm">
              <button
                onClick={async () => {
                  if (q.is_bookmarked) {
                    await api.removeBookmark(q.id);
                  } else {
                    await api.addBookmark(q.id);
                  }
                  load();
                }}
                className="text-upsc-navy"
              >
                {q.is_bookmarked ? 'Unbookmark' : 'Bookmark'}
              </button>
              <button
                onClick={async () => {
                  await api.duplicateQuestion(q.id);
                  load();
                }}
                className="text-gray-600"
              >
                Duplicate
              </button>
              <button
                onClick={async () => {
                  if (confirm('Delete this question?')) {
                    await api.deleteQuestion(q.id);
                    load();
                  }
                }}
                className="text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
