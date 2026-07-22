import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-2 mb-8 px-2">
            <span className="text-xl font-bold text-green-500 font-display">TNC Guardian</span>
          </div>
          <nav className="space-y-1">
            <Link
              to="/dashboard"
              className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive('/dashboard')
                  ? 'bg-green-600/10 text-green-400 border-l-2 border-green-500'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/documents"
              className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive('/documents')
                  ? 'bg-green-600/10 text-green-400 border-l-2 border-green-500'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Documents
            </Link>
            <Link
              to="/history"
              className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive('/history')
                  ? 'bg-green-600/10 text-green-400 border-l-2 border-green-500'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Analysis History
            </Link>
            <Link
              to="/profile"
              className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive('/profile')
                  ? 'bg-green-600/10 text-green-400 border-l-2 border-green-500'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Profile
            </Link>
            <Link
              to="/settings"
              className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive('/settings')
                  ? 'bg-green-600/10 text-green-400 border-l-2 border-green-500'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Settings
            </Link>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition"
        >
          Sign Out
        </button>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold font-display">TNC Guardian Workspace</h1>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-sm font-semibold text-slate-200">{user?.full_name || 'User'}</span>
              <span className="block text-xs text-slate-500">{user?.email}</span>
            </div>
            
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (user?.full_name || 'U').charAt(0).toUpperCase()
              )}
            </div>

            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-red-400 border border-slate-800 rounded font-medium transition"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
