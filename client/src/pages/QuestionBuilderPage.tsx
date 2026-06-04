import { FormEvent, useEffect, useState } from 'react';
import { api, Section, Topic } from '../services/api';

export default function QuestionBuilderPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [mode, setMode] = useState<'smart' | 'manual'>('smart');
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [tags, setTags] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getSections().then(setSections);
  }, []);

  useEffect(() => {
    if (sectionId) api.getTopics(Number(sectionId)).then(setTopics);
    else setTopics([]);
  }, [sectionId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      if (mode === 'smart') {
        await api.createQuestion({
          topic_id: Number(topicId),
          question_text: question,
          correct_answer: correctAnswer,
          difficulty_level: difficulty,
          tags,
          smart_mode: true,
        });
      } else {
        await api.createQuestion({
          topic_id: Number(topicId),
          question_text: question,
          correct_answer: correctAnswer,
          difficulty_level: difficulty,
          tags,
          options: [optA, optB, optC, optD],
          smart_mode: false,
        });
      }
      setMessage('Question created successfully!');
      setQuestion('');
      setCorrectAnswer('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const handleBulk = async () => {
    const lines = bulkText.trim().split('\n').filter(Boolean);
    const questions: { question: string; answer: string }[] = [];
    let currentQ = '';
    for (const line of lines) {
      if (line.startsWith('Question:')) {
        currentQ = line.replace('Question:', '').trim();
      } else if (line.startsWith('Answer:') && currentQ) {
        questions.push({
          question: currentQ,
          answer: line.replace('Answer:', '').trim(),
        });
        currentQ = '';
      }
    }
    if (questions.length === 0) {
      setMessage('No valid Question/Answer pairs found');
      return;
    }
    const res = await api.bulkQuestions({
      topic_id: Number(topicId),
      questions,
      smart_mode: true,
    });
    setMessage(`Bulk upload: ${(res as { created: number }).created} questions created`);
    setBulkText('');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-upsc-navy">Question Builder</h2>
      <p className="text-gray-500 mt-1">Manual or smart MCQ creation</p>

      {message && (
        <p className="mt-4 text-sm p-2 rounded bg-green-50 text-green-800">{message}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode('smart')}
          className={`px-3 py-1 rounded ${mode === 'smart' ? 'bg-upsc-navy text-white' : 'border'}`}
        >
          Smart Entry
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`px-3 py-1 rounded ${mode === 'manual' ? 'bg-upsc-navy text-white' : 'border'}`}
        >
          Manual Entry
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-w-2xl">
        <div className="flex gap-4">
          <select
            className="flex-1 border rounded-lg px-3 py-2"
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value);
              setTopicId('');
            }}
            required
          >
            <option value="">Select section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.section_name}
              </option>
            ))}
          </select>
          <select
            className="flex-1 border rounded-lg px-3 py-2"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            required
          >
            <option value="">Select topic</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.topic_name}
              </option>
            ))}
          </select>
        </div>

        <textarea
          className="w-full border rounded-lg px-3 py-2 min-h-[80px]"
          placeholder="Question text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />

        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Correct answer"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          required
        />

        {mode === 'manual' && (
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded-lg px-3 py-2" placeholder="Option A" value={optA} onChange={(e) => setOptA(e.target.value)} required />
            <input className="border rounded-lg px-3 py-2" placeholder="Option B" value={optB} onChange={(e) => setOptB(e.target.value)} required />
            <input className="border rounded-lg px-3 py-2" placeholder="Option C" value={optC} onChange={(e) => setOptC(e.target.value)} required />
            <input className="border rounded-lg px-3 py-2" placeholder="Option D" value={optD} onChange={(e) => setOptD(e.target.value)} required />
          </div>
        )}

        {mode === 'smart' && (
          <p className="text-sm text-gray-500">
            Three incorrect options will be auto-generated from your answer pool.
          </p>
        )}

        <div className="flex gap-4">
          <select
            className="border rounded-lg px-3 py-2"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <input
            className="flex-1 border rounded-lg px-3 py-2"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <button type="submit" className="px-6 py-2 bg-upsc-navy text-white rounded-lg">
          Save Question
        </button>
      </form>

      <div className="mt-10 max-w-2xl">
        <h3 className="font-semibold">Bulk Upload</h3>
        <p className="text-sm text-gray-500 mt-1">
          Format: Question: ... then Answer: ... (one pair per block)
        </p>
        <textarea
          className="w-full border rounded-lg px-3 py-2 mt-2 min-h-[120px] font-mono text-sm"
          placeholder={`Question: Kaziranga National Park is located in which state?\nAnswer: Assam\n\nQuestion: Project Tiger was launched in which year?\nAnswer: 1973`}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
        />
        <button
          type="button"
          onClick={handleBulk}
          disabled={!topicId}
          className="mt-2 px-4 py-2 bg-upsc-gold text-upsc-navy rounded-lg disabled:opacity-50"
        >
          Bulk Save
        </button>
      </div>
    </div>
  );
}
