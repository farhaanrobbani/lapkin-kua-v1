import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PejabatPenilai } from '../../types/index';
import { UserCheck, Save, Stamp, Image, Shield } from 'lucide-react';

interface Props {
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const PejabatPenilaiSettings: React.FC<Props> = ({ showToast }) => {
  const { token } = useAuth();
  const [data, setData] = useState<PejabatPenilai | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPejabat = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pejabat-penilai', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.pejabatPenilai);
      }
    } catch {
      showToast('error', 'Gagal memuat data Pejabat Penilai.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPejabat();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !data.nama || !data.nip || !data.jabatan) {
      showToast('error', 'Nama, NIP, dan Jabatan Pejabat Penilai wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/pejabat-penilai', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        showToast('success', 'Data Pejabat Penilai (Kepala KUA) berhasil diperbarui!');
      } else {
        showToast('error', 'Gagal memperbarui data Pejabat Penilai.');
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
        Memuat konfigurasi Pejabat Penilai...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-1">
        <div className="flex items-center space-x-2">
          <UserCheck className="w-6 h-6 text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Pengaturan Pejabat Penilai (Kepala KUA)
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ubah identitas Pejabat Penilai / Kepala KUA yang akan tercantum pada seluruh footer Tanda Tangan Laporan Kinerja & Rekap Tukin secara dinamis tanpa perlu mengubah kode aplikasi.
        </p>
      </div>

      {/* Form */}
      {data && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap Pejabat Penilai & Gelar *
              </label>
              <input
                type="text"
                value={data.nama}
                onChange={e => setData({ ...data, nama: e.target.value })}
                placeholder="Mohamad Amin, S.HI"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NIP Pejabat Penilai *
                </label>
                <input
                  type="text"
                  value={data.nip}
                  onChange={e => setData({ ...data, nip: e.target.value })}
                  placeholder="197203102001121001"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jabatan Pejabat Penilai *
                </label>
                <input
                  type="text"
                  value={data.jabatan}
                  onChange={e => setData({ ...data, jabatan: e.target.value })}
                  placeholder="Kepala KUA Ampelgading"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Opsi Anchor Tanda Tangan */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Anchor Tanda Tangan (Posisi di Atas Nama)
            </label>
            <div className="flex items-center space-x-4">
              {[
                { value: '#', label: '#' },
                { value: '^', label: '^ (Caret)' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="opsi_anchor_ttd"
                    value={opt.value}
                    checked={data.opsi_anchor_ttd === opt.value}
                    onChange={e => setData({ ...data, opsi_anchor_ttd: e.target.value })}
                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{opt.label}</span>
                </label>
              ))}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="opsi_anchor_ttd"
                  value=""
                  checked={!data.opsi_anchor_ttd}
                  onChange={e => setData({ ...data, opsi_anchor_ttd: '' })}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">Tanpa Anchor</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Memperbarui...' : 'Simpan Perubahan Pejabat Penilai'}</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
