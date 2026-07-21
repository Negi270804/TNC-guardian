import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-2 mb-8 px-2">
            <span className="text-xl font-bold text-green-500">TNC Guardian</span>
          </div>
          <nav className="space-y-1">
            <Link
              to="/dashboard"
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              to="/history"
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              History Logs
            </Link>
            <Link
              to="/settings"
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Settings
            </Link>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300"
        >
          Sign Out
        </button>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold">TNC Guardian Workspace</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">User Mode</span>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm text-white">
              U
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
