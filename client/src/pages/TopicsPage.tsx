import { FormEvent, useEffect, useState } from 'react';
import { api, Section, Topic } from '../services/api';

export default function TopicsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    api.getSections().then(setSections);
  }, []);

  useEffect(() => {
    api.getTopics(sectionId ? Number(sectionId) : undefined).then(setTopics);
  }, [sectionId]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!sectionId || !newName.trim()) return;
    await api.createTopic(Number(sectionId), newName.trim());
    setNewName('');
    api.getTopics(Number(sectionId)).then(setTopics);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-upsc-navy">Topic Management</h2>
      <p className="text-gray-500 mt-1">Micro-topics within sections</p>

      <select
        className="mt-4 border rounded-lg px-3 py-2 w-full max-w-md"
        value={sectionId}
        onChange={(e) => setSectionId(e.target.value)}
      >
        <option value="">All sections</option>
        {sections.map((s) => (
          <option key={s.id} value={s.id}>
            {s.section_name}
          </option>
        ))}
      </select>

      <form onSubmit={handleAdd} className="mt-4 flex gap-2 max-w-xl">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="New topic name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={!sectionId}
        />
        <button
          type="submit"
          disabled={!sectionId}
          className="px-4 py-2 bg-upsc-navy text-white rounded-lg disabled:opacity-50"
        >
          Add Topic
        </button>
      </form>

      <div className="mt-6 grid gap-2">
        {topics.map((t) => (
          <div key={t.id} className="bg-white border rounded-lg p-3 flex justify-between">
            {editId === t.id ? (
              <div className="flex gap-2 flex-1">
                <input
                  className="flex-1 border rounded px-2"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <button
                  onClick={async () => {
                    await api.updateTopic(t.id, editName);
                    setEditId(null);
                    api.getTopics(sectionId ? Number(sectionId) : undefined).then(setTopics);
                  }}
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <div>
                  <span className="font-medium">{t.topic_name}</span>
                  <span className="text-xs text-gray-400 ml-2">{t.section_name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {t.question_count ?? 0} questions
                  </span>
                </div>
                <div className="flex gap-2 text-sm">
                  <button
                    onClick={() => {
                      setEditId(t.id);
                      setEditName(t.topic_name);
                    }}
                    className="text-upsc-navy"
                  >
                    Rename
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Delete this topic?')) {
                        await api.deleteTopic(t.id);
                        api.getTopics(sectionId ? Number(sectionId) : undefined).then(setTopics);
                      }
                    }}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
