import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/sections', label: 'Sections' },
  { to: '/topics', label: 'Topics' },
  { to: '/builder', label: 'Question Builder' },
  { to: '/bank', label: 'Question Bank' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/bookmarks', label: 'Bookmarks' },
  { to: '/revision', label: 'Revision' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout() {
  const { username, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-upsc-navy text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <h1 className="font-bold text-lg leading-tight">UPSC MCQ Portal</h1>
          <p className="text-xs text-white/60 mt-1">Smart Practice</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-3 py-2 rounded text-sm ${
                location.pathname === item.to
                  ? 'bg-upsc-gold text-upsc-navy font-semibold'
                  : 'hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 text-sm">
          <p className="text-white/70 truncate">{username}</p>
          <button
            onClick={() => logout()}
            className="mt-2 text-upsc-gold hover:underline text-xs"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
