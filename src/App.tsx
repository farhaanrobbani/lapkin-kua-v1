import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { OverviewStats } from './components/dashboard/OverviewStats';
import { KuaDailyManagement } from './components/admin/KuaDailyManagement';
import { StaffActivityManagement } from './components/staff/StaffActivityManagement';
import { ReportExportView } from './components/reports/ReportExportView';
import { UserManagement } from './components/admin/UserManagement';
import { PejabatPenilaiSettings } from './components/admin/PejabatPenilaiSettings';
import { AppSettings } from './components/admin/AppSettings';
import { TelegramBotPanel } from './components/telegram/TelegramBotPanel';
import { DeploymentGuideView } from './components/deployment/DeploymentGuideView';
import { ToastContainer, ToastMessage } from './components/ui/Toast';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('kua_theme') === 'dark' ||
      (!('kua_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kua_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kua_theme', 'light');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Memuat Sistem Informasi KUA...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
        <main className="py-10">
          {authView === 'login' ? (
            <LoginForm onSwitchToRegister={() => setAuthView('register')} showToast={showToast} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setAuthView('login')} showToast={showToast} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto sm:px-6 lg:px-8 py-6 gap-6">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
          {activeTab === 'dashboard' && <OverviewStats onNavigate={setActiveTab} />}
          {activeTab === 'kua_daily' && <KuaDailyManagement showToast={showToast} />}
          {activeTab === 'staff_activities' && <StaffActivityManagement showToast={showToast} />}
          {activeTab === 'report_export' && <ReportExportView showToast={showToast} />}
          {activeTab === 'user_management' && <UserManagement showToast={showToast} />}
          {activeTab === 'pejabat_penilai' && <PejabatPenilaiSettings showToast={showToast} />}
          {activeTab === 'app_settings' && <AppSettings showToast={showToast} />}
          {activeTab === 'telegram' && <TelegramBotPanel showToast={showToast} />}
          {activeTab === 'deployment' && <DeploymentGuideView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

