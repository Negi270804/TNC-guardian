import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Mobile Drawer Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sliding Mobile Sidebar Panel */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:flex transition-transform duration-300 ease-in-out`}
      >
        <div>
          <div className="flex items-center justify-between mb-8 px-2">
            <span className="text-xl font-bold text-green-500 font-display">TNC Guardian</span>
            {/* Close button for mobile */}
            <button 
              onClick={closeSidebar}
              className="lg:hidden p-1.5 rounded-md hover:bg-slate-850 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <nav className="space-y-1">
            {[
              { to: '/dashboard', label: 'Dashboard' },
              { to: '/documents', label: 'Documents' },
              { to: '/history', label: 'Analysis History' },
              { to: '/subscription', label: 'Subscription' },
              { to: '/profile', label: 'Profile' },
              { to: '/settings', label: 'Settings' }
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={`block px-3 py-2.5 rounded-md text-sm font-medium transition ${
                  isActive(item.to) || (item.to === '/subscription' && isActive('/pricing'))
                    ? 'bg-green-600/10 text-green-400 border-l-2 border-green-500'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={() => {
            closeSidebar();
            handleLogout();
          }}
          className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition mt-auto"
        >
          Sign Out
        </button>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            {/* Hamburger button for mobile/tablet */}
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-sm sm:text-lg font-semibold font-display truncate max-w-[150px] sm:max-w-none">
              TNC Guardian Workspace
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden md:block">
              <span className="block text-sm font-semibold text-slate-200">{user?.full_name || 'User'}</span>
              <span className="block text-xs text-slate-500">{user?.email}</span>
            </div>
            
            {/* User Avatar */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 overflow-hidden text-xs sm:text-sm">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (user?.full_name || 'U').charAt(0).toUpperCase()
              )}
            </div>

            <button
              onClick={handleLogout}
              className="text-xs px-2 py-1.5 sm:px-3 bg-slate-850 hover:bg-slate-800 text-red-400 border border-slate-850 rounded font-medium transition"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
