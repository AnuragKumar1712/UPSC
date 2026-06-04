import { FormEvent, useState } from 'react';
import { api } from '../services/api';

export default function SettingsPage() {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [message, setMessage] = useState('');

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.changePassword(current, newPass);
      setMessage('Password updated successfully');
      setCurrent('');
      setNewPass('');
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const handleBackup = async () => {
    const res = await api.backupDb();
    setMessage(`Backup created: ${res.filename}`);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-upsc-navy">Settings</h2>

      {message && (
        <p className="mt-4 text-sm p-2 rounded bg-blue-50 text-blue-800">{message}</p>
      )}

      <section className="mt-8 max-w-md">
        <h3 className="font-semibold">Change Password</h3>
        <form onSubmit={handlePassword} className="mt-3 space-y-3">
          <input
            type="password"
            placeholder="Current password"
            className="w-full border rounded-lg px-3 py-2"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New password (min 6 chars)"
            className="w-full border rounded-lg px-3 py-2"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" className="px-4 py-2 bg-upsc-navy text-white rounded-lg">
            Update Password
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h3 className="font-semibold">Export & Backup</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href={api.exportDbUrl()}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            Download upsc.db
          </a>
          <button
            onClick={handleBackup}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            Create Weekly Backup
          </button>
          <a
            href={api.exportQuestionsUrl('json')}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            Export JSON
          </a>
          <a
            href={api.exportQuestionsUrl('csv')}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            Export CSV
          </a>
          <a
            href={api.exportQuestionsUrl('xlsx')}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            Export Excel
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Backups are stored in server/data/backups/
        </p>
      </section>
    </div>
  );
}
