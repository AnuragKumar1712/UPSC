import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { username, login, loading } = useAuth();
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && username) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(user, pass);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-upsc-navy">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-upsc-navy">UPSC MCQ Portal</h1>
        <p className="text-gray-500 text-sm mt-1">Admin login</p>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}

        <label className="block mt-6 text-sm font-medium">Username</label>
        <input
          className="mt-1 w-full border rounded-lg px-3 py-2"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          autoComplete="username"
        />

        <label className="block mt-4 text-sm font-medium">Password</label>
        <input
          type="password"
          className="mt-1 w-full border rounded-lg px-3 py-2"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full bg-upsc-navy text-white py-2.5 rounded-lg font-medium hover:bg-upsc-navy/90 disabled:opacity-50"
        >
          {submitting ? 'Signing in...' : 'Login'}
        </button>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Default: admin / admin123
        </p>
      </form>
    </div>
  );
}
