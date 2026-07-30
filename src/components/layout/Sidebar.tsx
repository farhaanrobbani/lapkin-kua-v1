import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet,
  Users,
  Award,
  FileText,
  UserCheck,
  Settings
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'kua_daily'
  | 'staff_activities'
  | 'user_management'
  | 'pejabat_penilai'
  | 'app_settings'
  | 'report_export'
  | 'telegram'
  | 'deployment';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [kuaName, setKuaName] = React.useState('KUA Ampelgading');

  React.useEffect(() => {
    if (token) {
      fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => { if (d.settings?.kua_instansi) setKuaName(d.settings.kua_instansi); })
        .catch(() => {});
    }
  }, [token]);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Utama',
      icon: LayoutDashboard,
      roles: ['admin', 'staf']
    },
    {
      id: 'kua_daily',
      label: 'Data Master KUA Harian',
      icon: CalendarDays,
      roles: ['admin'],
      badge: 'Admin'
    },
    {
      id: 'staff_activities',
      label: 'Log Kegiatan Staf',
      icon: FileSpreadsheet,
      roles: ['staf', 'admin']
    },
    {
      id: 'report_export',
      label: 'Cetak & Ekspor Laporan',
      icon: FileText,
      roles: ['admin', 'staf']
    },
    {
      id: 'user_management',
      label: 'Kelola Pengguna / Staf',
      icon: Users,
      roles: ['admin'],
      badge: 'Admin'
    },
    {
      id: 'pejabat_penilai',
      label: 'Pengaturan Pejabat Penilai',
      icon: UserCheck,
      roles: ['admin'],
      badge: 'Admin'
    },
    {
      id: 'app_settings',
      label: 'Pengaturan Aplikasi',
      icon: Settings,
      roles: ['admin'],
      badge: 'Admin'
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 transition-colors">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          NAVIGASI UTAMA
        </p>

        {navItems
          .filter(item => item.roles.includes(user?.role || 'staf'))
          .map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as NavTab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && !isActive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* Footer Info Box */}
      <div className="mt-8 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          <Award className="w-4 h-4 text-emerald-500" />
          <span>{kuaName}</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Sistem Laporan Kinerja & Rekap Tukin Otomatis
        </p>
      </div>
    </aside>
  );
};
