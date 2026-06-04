import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Section, Topic } from '../services/api';

export default function QuizPage() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [count, setCount] = useState(10);
  const [timer, setTimer] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSections().then(setSections);
  }, []);

  useEffect(() => {
    if (sectionId) api.getTopics(Number(sectionId)).then(setTopics);
    else setTopics([]);
  }, [sectionId]);

  const handleStart = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.generateQuiz({
        section_id: sectionId || undefined,
        topic_id: topicId || undefined,
        difficulty: difficulty || undefined,
        count,
      });
      sessionStorage.setItem(
        'activeQuiz',
        JSON.stringify({
          questions: res.questions,
          filters: { section: sectionId, topic: topicId, difficulty },
          timer,
        })
      );
      navigate('/quiz/attempt');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-upsc-navy">Quiz Module</h2>
      <p className="text-gray-500 mt-1">Configure and start a practice test</p>

      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

      <form onSubmit={handleStart} className="mt-6 max-w-md space-y-4">
        <div>
          <label className="text-sm font-medium">Section (optional)</label>
          <select
            className="w-full mt-1 border rounded-lg px-3 py-2"
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value);
              setTopicId('');
            }}
          >
            <option value="">Mixed / All</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.section_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Topic (optional)</label>
          <select
            className="w-full mt-1 border rounded-lg px-3 py-2"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
          >
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.topic_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Difficulty</label>
          <select
            className="w-full mt-1 border rounded-lg px-3 py-2"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">Any</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Number of questions</label>
          <input
            type="number"
            min={1}
            max={200}
            className="w-full mt-1 border rounded-lg px-3 py-2"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={timer} onChange={(e) => setTimer(e.target.checked)} />
          Enable timer (display only)
        </label>

        <button type="submit" className="w-full py-2.5 bg-upsc-gold text-upsc-navy font-semibold rounded-lg">
          Start Quiz
        </button>
      </form>
    </div>
  );
}
