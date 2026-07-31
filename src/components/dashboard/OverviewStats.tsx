import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KuaDailyData, StaffActivity } from '../../types/index';
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
  FileCheck,
  Settings,
  X,
  Check
} from 'lucide-react';
import {
  getDashboardCards,
  getDashboardCardSelection,
  setDashboardCardSelection,
  computeCardValue,
  DashboardCardDef
} from './dashboardCards';

export const OverviewStats: React.FC<{ onNavigate: (tab: any) => void }> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [dailyData, setDailyData] = useState<KuaDailyData[]>([]);
  const [activities, setActivities] = useState<StaffActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [kuaName, setKuaName] = useState('KUA Ampelgading');
  const [cards, setCards] = useState<DashboardCardDef[]>(getDashboardCards);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>(getDashboardCardSelection);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

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

  useEffect(() => {
    const onCardsUpdate = () => setSelectedCardIds(getDashboardCardSelection());
    const onMasterUpdate = () => {
      setCards(getDashboardCards());
      setSelectedCardIds(getDashboardCardSelection());
    };
    window.addEventListener('kua_dashboard_cards_updated', onCardsUpdate);
    window.addEventListener('kua_master_columns_updated', onMasterUpdate);
    return () => {
      window.removeEventListener('kua_dashboard_cards_updated', onCardsUpdate);
      window.removeEventListener('kua_master_columns_updated', onMasterUpdate);
    };
  }, []);

  const visibleCards = cards.filter(c => selectedCardIds.includes(c.id));

  const toggleCard = (id: string) => {
    setSelectedCardIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSaveCards = () => {
    setDashboardCardSelection(selectedCardIds);
    setIsCardModalOpen(false);
  };

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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span>Ringkasan Statistik</span>
          </h3>
          <button
            onClick={() => setIsCardModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Atur Kartu</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleCards.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Belum ada kartu statistik yang dipilih.{' '}
                <button
                  onClick={() => setIsCardModalOpen(true)}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  Atur Kartu
                </button>
              </p>
            </div>
          ) : (
            visibleCards.map(card => {
              const Icon = card.icon;
              const value = computeCardValue(card, dailyData);
              return (
                <div key={card.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {card.label}
                    </span>
                    <div className={`w-9 h-9 rounded-xl ${card.color.box} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
                    {loading ? '...' : `${value} ${card.unit}`}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1">
                    <TrendingUp className={`w-3 h-3 ${card.color.text}`} />
                    <span>{card.subtitle}</span>
                  </p>
                </div>
              );
            })
          )}
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

      {/* Customize Cards Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsCardModalOpen(false)}>
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-emerald-500" />
                  <span>Atur Kartu Dashboard</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Pilih kartu statistik yang ingin ditampilkan di dashboard.
                </p>
              </div>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[50vh] overflow-y-auto space-y-1.5">
              {cards.map(card => {
                const Icon = card.icon;
                const isChecked = selectedCardIds.includes(card.id);
                return (
                  <label
                    key={card.id}
                    className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCard(card.id)}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <div className={`w-8 h-8 rounded-lg ${card.color.box} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{card.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{card.subtitle} · {card.unit}</p>
                    </div>
                    {isChecked && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedCardIds.length} kartu terpilih
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveCards}
                  disabled={selectedCardIds.length === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
