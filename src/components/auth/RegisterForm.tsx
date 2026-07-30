import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, UserPlus, ArrowLeft } from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, showToast }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nama: '',
    nip: '',
    jabatan: 'Penghulu Ahli Pertama',
    level_jabatan: 'Fungsional',
    pangkat: 'Penata Muda',
    ruang_golongan: 'III/a',
    grade_tukin: 8,
    jumlah_tukin_kotor: 4595000,
    jumlah_tukin_bersih: 4365250,
    gapok: 3600000,
    instansi: 'KUA Ampelgading'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.nama || !formData.nip) {
      showToast('error', 'Silakan lengkapi Email, Password, Nama, dan NIP.');
      return;
    }
    setLoading(true);
    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      showToast('success', 'Pendaftaran staf berhasil!');
    } else {
      showToast('error', result.error || 'Pendaftaran gagal');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <button
            onClick={onSwitchToLogin}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Login</span>
          </button>
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Pendaftaran Staf / Pegawai KUA
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lengkapi profil kepegawaian Anda untuk mencatat kinerja dan cetak rekap Tukin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap & Gelar *
              </label>
              <input
                type="text"
                value={formData.nama}
                onChange={e => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Ahmad Fauzi, S.Ag"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                NIP *
              </label>
              <input
                type="text"
                value={formData.nip}
                onChange={e => setFormData({ ...formData, nip: e.target.value })}
                placeholder="198808152014031002"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Akun *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="fauzi@kua.go.id"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kata Sandi *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Jabatan
              </label>
              <input
                type="text"
                value={formData.jabatan}
                onChange={e => setFormData({ ...formData, jabatan: e.target.value })}
                placeholder="Penghulu Ahli Pertama / JFU / PPNPN"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Pangkat & Golongan/Ruang
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.pangkat}
                  onChange={e => setFormData({ ...formData, pangkat: e.target.value })}
                  placeholder="Penata Muda"
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                  type="text"
                  value={formData.ruang_golongan}
                  onChange={e => setFormData({ ...formData, ruang_golongan: e.target.value })}
                  placeholder="III/a"
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Grade Tukin & Tukin Kotor (Rp)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={formData.grade_tukin}
                  onChange={e => setFormData({ ...formData, grade_tukin: Number(e.target.value) })}
                  placeholder="Grade (e.g. 8)"
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                  type="number"
                  value={formData.jumlah_tukin_kotor}
                  onChange={e => setFormData({ ...formData, jumlah_tukin_kotor: Number(e.target.value) })}
                  placeholder="4595000"
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tukin Bersih & Gaji Pokok (Rp)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={formData.jumlah_tukin_bersih}
                  onChange={e => setFormData({ ...formData, jumlah_tukin_bersih: Number(e.target.value) })}
                  placeholder="4365250"
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                  type="number"
                  value={formData.gapok}
                  onChange={e => setFormData({ ...formData, gapok: Number(e.target.value) })}
                  placeholder="3600000"
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-4"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Daftar...' : 'Daftar Staf Sekarang'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
