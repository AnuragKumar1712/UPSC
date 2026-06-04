import { FormEvent, useEffect, useState } from 'react';
import { api, Section } from '../services/api';

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const load = () => api.getSections().then(setSections);

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await api.createSection(newName.trim());
    setNewName('');
    load();
  };

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;
    await api.updateSection(id, editName.trim());
    setEditId(null);
    load();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete section "${name}" and all its topics/questions?`)) return;
    await api.deleteSection(id);
    load();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-upsc-navy">Section Management</h2>
      <p className="text-gray-500 mt-1">Organize major UPSC subjects</p>

      <form onSubmit={handleAdd} className="mt-6 flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="New section name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 bg-upsc-navy text-white rounded-lg">
          Add Section
        </button>
      </form>

      <div className="mt-6 grid gap-3">
        {sections.map((s) => (
          <div
            key={s.id}
            className="bg-white border rounded-lg p-4 flex items-center justify-between"
          >
            {editId === s.id ? (
              <div className="flex gap-2 flex-1">
                <input
                  className="flex-1 border rounded px-2 py-1"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <button
                  onClick={() => handleRename(s.id)}
                  className="text-sm text-upsc-navy font-medium"
                >
                  Save
                </button>
                <button onClick={() => setEditId(null)} className="text-sm text-gray-400">
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-medium">{s.section_name}</p>
                  <p className="text-xs text-gray-400">
                    {s.topic_count ?? 0} topics · {s.question_count ?? 0} questions
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(s.id);
                      setEditName(s.section_name);
                    }}
                    className="text-sm text-upsc-navy"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.section_name)}
                    className="text-sm text-red-600"
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
