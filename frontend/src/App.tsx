import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazyWithRetry } from '@/utils/lazy-retry';

// Lazy load page components to enable code splitting and optimize build size with self-healing retries
const Landing = lazyWithRetry(() => import('@/pages/Landing').then(m => ({ default: m.Landing })));
const Login = lazyWithRetry(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Register = lazyWithRetry(() => import('@/pages/Register').then(m => ({ default: m.Register })));
const Dashboard = lazyWithRetry(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Documents = lazyWithRetry(() => import('@/pages/Documents').then(m => ({ default: m.Documents })));
const DocumentDetails = lazyWithRetry(() => import('@/pages/DocumentDetails').then(m => ({ default: m.DocumentDetails })));
const Results = lazyWithRetry(() => import('@/pages/Results').then(m => ({ default: m.Results })));
const Profile = lazyWithRetry(() => import('@/pages/Profile').then(m => ({ default: m.Profile })));
const History = lazyWithRetry(() => import('@/pages/History').then(m => ({ default: m.History })));
const Settings = lazyWithRetry(() => import('@/pages/Settings').then(m => ({ default: m.Settings })));
const NotFound = lazyWithRetry(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })));
const ForgotPassword = lazyWithRetry(() => import('@/pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazyWithRetry(() => import('@/pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const SubscriptionPage = lazyWithRetry(() => import('@/pages/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })));
const PricingPage = lazyWithRetry(() => import('@/pages/PricingPage').then(m => ({ default: m.PricingPage })));

import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

import { env } from '@/config/env';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 120000,
    },
  },
});

export const App: React.FC = () => {
  React.useEffect(() => {
    document.title = `${env.VITE_APP_NAME} - Understand terms before clicking 'I Agree'`;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
          <React.Suspense
            fallback={
              <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-200">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                  <p className="text-sm font-medium text-slate-400">Loading...</p>
                </div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Landing />} />

              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/documents/:id" element={<DocumentDetails />} />
                <Route path="/results/:id" element={<Results />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/history" element={<History />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              <Route path="/404" element={<NotFound />} />
              <Route path="/500" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </AuthProvider>
     </ThemeProvider>
    </QueryClientProvider>
  );
};
