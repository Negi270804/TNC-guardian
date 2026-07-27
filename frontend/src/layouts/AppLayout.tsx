import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { env } from '@/config/env';
import { motion } from 'framer-motion';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#090d16] text-slate-800 dark:text-slate-200 overflow-x-hidden transition-colors duration-300">
      {/* Mobile Drawer Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sliding Mobile Sidebar Panel */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between p-4 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:flex transition-transform duration-300 ease-in-out`}
      >
        <div>
          <div className="flex items-center justify-between mb-8 px-2 select-none">
            <span className="text-xl font-bold text-brand-500 dark:text-brand-400 font-display">{env.VITE_APP_NAME}</span>
            {/* Close button for mobile */}
            <button 
              onClick={closeSidebar}
              className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-950 dark:hover:text-white"
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
              <motion.div
                key={item.to}
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              >
                <Link
                  to={item.to}
                  onClick={closeSidebar}
                  className={`block px-3 py-2.5 rounded-md text-sm font-medium transition ${
                    isActive(item.to) || (item.to === '/subscription' && isActive('/pricing'))
                      ? 'bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 border-l-2 border-brand-500 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>
        
        {/* Sidebar Footer Logout button */}
        <button
          onClick={() => {
            closeSidebar();
            handleLogout();
          }}
          className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-650 transition mt-auto select-none"
        >
          Sign Out
        </button>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-905/85 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 transition-colors duration-300">
          <div className="flex items-center gap-3">
            {/* Hamburger button for mobile/tablet */}
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-950 dark:hover:text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-sm sm:text-lg font-semibold font-display text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-none">
              {env.VITE_APP_NAME} Workspace
            </h1>
          </div>
          
          <div className="flex items-center gap-2.5 sm:gap-4">
            
            {/* Smooth Theme Switcher Button */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm select-none"
              aria-label="Toggle Light/Dark Theme"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'light' ? (
                <span className="text-sm block leading-none">🌙</span>
              ) : (
                <span className="text-sm block leading-none">☀️</span>
              )}
            </motion.button>

            <div className="text-right hidden md:block select-none">
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{user?.full_name || 'User'}</span>
              <span className="block text-xs text-slate-400 dark:text-slate-500">{user?.email}</span>
            </div>
            
            {/* User Avatar */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-250 dark:border-slate-700/80 flex items-center justify-center font-bold text-slate-655 dark:text-slate-350 overflow-hidden text-xs sm:text-sm select-none">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (user?.full_name || 'U').charAt(0).toUpperCase()
              )}
            </div>

            <motion.button
              onClick={handleLogout}
              whileTap={{ scale: 0.96 }}
              className="text-xs px-2.5 py-1.5 sm:px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-red-500 border border-slate-200 dark:border-slate-800 rounded-lg font-medium transition select-none"
            >
              Logout
            </motion.button>
          </div>
        </header>

        {/* Animate outlet transitions */}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex-1 p-4 sm:p-8 overflow-y-auto"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};
