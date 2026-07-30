import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, LogOut, Moon, Sun, Shield, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand logo & title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              SILAP-KUA
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sistem Informasi Laporan Kinerja KUA
            </p>
          </div>
        </div>

        {/* Right side user info & actions */}
        {user && (
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Role badge */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {user.role === 'admin' ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Admin Pengelola</span>
                </>
              ) : (
                <>
                  <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>Staf / Pegawai</span>
                </>
              )}
            </div>

            {/* User Avatar & Name */}
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <img
                src={user.foto_profil_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={user.nama}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/30"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">{user.nama}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">NIP. {user.nip}</p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
