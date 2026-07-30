import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Save, Building } from 'lucide-react';

interface Props {
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const AppSettings: React.FC<Props> = ({ showToast }) => {
  const { token } = useAuth();
  const [kuaInstansi, setKuaInstansi] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setKuaInstansi(json.settings?.kua_instansi || '');
      }
    } catch {
      showToast('error', 'Gagal memuat pengaturan aplikasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSettings();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kuaInstansi.trim()) {
      showToast('error', 'Nama KUA / Instansi tidak boleh kosong.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ kua_instansi: kuaInstansi.trim() })
      });

      if (res.ok) {
        showToast('success', 'Nama KUA / Instansi berhasil diperbarui!');
      } else {
        showToast('error', 'Gagal memperbarui pengaturan.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan koneksi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        Memuat pengaturan aplikasi...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-1">
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Pengaturan Aplikasi
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ubah nama KUA / Instansi yang akan muncul di sidebar, dashboard, laporan, dan ekspor dokumen.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nama KUA / Instansi *
          </label>
          <div className="relative">
            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={kuaInstansi}
              onChange={e => setKuaInstansi(e.target.value)}
              placeholder="KUA Ampelgading"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Nama ini akan digunakan di sidebar, dashboard, judul laporan, dan pesan Telegram.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
