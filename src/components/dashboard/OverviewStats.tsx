import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KuaDailyData, StaffActivity } from '../../types/index';
import { formatRupiah } from '../../utils/formatters';
import {
  CalendarDays,
  FileSpreadsheet,
  Building,
  HeartHandshake,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export const OverviewStats: React.FC<{ onNavigate: (tab: any) => void }> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [dailyData, setDailyData] = useState<KuaDailyData[]>([]);
  const [activities, setActivities] = useState<StaffActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [kuaName, setKuaName] = useState('KUA Ampelgading');

  const currentMonth = 7; // July 2026
  const currentYear = 2026;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resDaily, resAct, resSettings] = await Promise.all([
          fetch(`/api/kua-daily?month=${currentMonth}&year=${currentYear}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/staff-activities?month=${currentMonth}&year=${currentYear}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (resDaily.ok) {
          const d = await resDaily.json();
          setDailyData(d.data || []);
        }
        if (resAct.ok) {
          const a = await resAct.json();
          setActivities(a.activities || []);
        }
        if (resSettings.ok) {
          const s = await resSettings.json();
          if (s.settings?.kua_instansi) setKuaName(s.settings.kua_instansi);
        }
      } catch (err) {
        console.error('Failed to load overview statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  // Aggregate stats
  const totalPendaftaranNikah = dailyData.reduce((acc, curr) => acc + curr.pendaftaran_nikah_kantor + curr.pendaftaran_nikah_luar_kantor, 0);
  const totalPelaksanaanNikah = dailyData.reduce((acc, curr) => acc + curr.pelaksanaan_nikah_kantor + curr.pelaksanaan_nikah_luar_kantor, 0);
  const totalNikahKantor = dailyData.reduce((acc, curr) => acc + curr.pelaksanaan_nikah_kantor, 0);
  const totalNikahLuarKantor = dailyData.reduce((acc, curr) => acc + curr.pelaksanaan_nikah_luar_kantor, 0);
  const totalBimwin = dailyData.reduce((acc, curr) => acc + curr.pelaksanaan_bimwin, 0);

  return (
    <div className="space-y-6">
      
      {/* Banner Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-emerald-100 border border-white/15">
            <Building className="w-3.5 h-3.5 text-emerald-300" />
            <span>{kuaName} — Periode Juli 2026</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Selamat Datang, {user?.nama}!
          </h2>
          <p className="text-sm text-emerald-100 max-w-2xl">
            {user?.role === 'admin'
              ? 'Anda masuk sebagai Admin Pengelola Laporan. Kelola data harian KUA, verifikasi kinerja staf, dan atur Pejabat Penilai.'
              : 'Anda masuk sebagai Staf / Pegawai. Catat log pekerjaan harian Anda, sinkronkan volume dari data KUA, dan cetak laporan kinerja serta rekap Tukin.'}
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Pendaftaran Nikah
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
            {loading ? '...' : `${totalPendaftaranNikah} Peristiwa`}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Terdaftar di KUA bulan ini</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Akad Nikah Luar Kantor
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
            {loading ? '...' : `${totalNikahLuarKantor} Pasang`}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Bedol & luar kantor
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Bimbingan Perkawinan
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
            {loading ? '...' : `${totalBimwin} Catin`}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Bimwin Mandiri & Kelompok
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Akad Nikah Kantor
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
            {loading ? '...' : `${totalNikahKantor} Pasang`}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Dilaksanakan di balai nikah KUA
          </p>
        </div>

      </div>

      {/* Quick Action Cards & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Action Quick Links */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>Aksi Cepat Menu Utama</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {user?.role === 'admin' && (
              <button
                onClick={() => onNavigate('kua_daily')}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Input Data Harian KUA
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Catat 10 indikator kegiatan KUA per tanggal untuk digunakan sebagai master rujukan staf.
                </p>
              </button>
            )}

            <button
              onClick={() => onNavigate('staff_activities')}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                Log Pekerjaan Harian Staf
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Isi rincian pekerjaan harian Anda, kuantitas akan otomatis tersinkronisasi dari master data.
              </p>
            </button>

            <button
              onClick={() => onNavigate('report_export')}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                Cetak & Ekspor Laporan
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ekspor Template 1 (Laporan Kinerja) & Template 2 (Rekap Tukin) ke PDF dan Word.
              </p>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => onNavigate('pejabat_penilai')}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Pengaturan Pejabat Penilai
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ubah NIP, Nama, dan Stempel Kepala KUA tanpa harus mengubah kode program.
                </p>
              </button>
            )}

          </div>
        </div>

        {/* Right Col: Recent Activity Stream */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>Log Kegiatan Terakhir</span>
            </h3>
            <button
              onClick={() => onNavigate('staff_activities')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Belum ada log kegiatan tercatat bulan ini.
              </p>
            ) : (
              activities.slice(0, 5).map(act => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{act.tanggal}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                      {act.total_jumlah} Berkas
                    </span>
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{act.kegiatan}</p>
                  <p className="text-slate-500 dark:text-slate-400 line-clamp-1">{act.pekerjaan}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
