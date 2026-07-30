import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StaffActivity, PejabatPenilai, User } from '../../types/index';
import { TemplateLaporanKinerja } from './TemplateLaporanKinerja';
import { TemplateRekapTukin } from './TemplateRekapTukin';
import { exportLaporanKinerjaPdf, exportRekapTukinPdf } from '../../utils/exportPdf';
import { exportLaporanKinerjaWord, exportRekapTukinWord } from '../../utils/exportWord';
import {
  FileText,
  Download,
  FileCode2,
} from 'lucide-react';

interface Props {
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const ReportExportView: React.FC<Props> = ({ showToast }) => {
  const { token, user } = useAuth();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(7);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [totalHariKerja, setTotalHariKerja] = useState<number>(22);
  const [kuaName, setKuaName] = useState('KUA Ampelgading');
  const [customCetakDate, setCustomCetakDate] = useState<string>('KUA Ampelgading, 31 Juli 2026');
  const [activeTemplate, setActiveTemplate] = useState<'template1' | 'template2'>('template1');

  const [activities, setActivities] = useState<StaffActivity[]>([]);
  const [pejabatPenilai, setPejabatPenilai] = useState<PejabatPenilai | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(user?.id || '');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !selectedUserId) {
      setSelectedUserId(user.id);
    }
  }, [user]);

  const targetUser = allUsers.find(u => u.id === selectedUserId) || user;

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [resAct, resPjb, resUsers, resSettings] = await Promise.all([
        fetch(`/api/staff-activities?user_id=${selectedUserId}&month=${selectedMonth}&year=${selectedYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/pejabat-penilai', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        user?.role === 'admin'
          ? fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } })
          : Promise.resolve(null),
        fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (resAct.ok) {
        const json = await resAct.json();
        setActivities(json.activities || []);
      }
      if (resPjb.ok) {
        const json = await resPjb.json();
        setPejabatPenilai(json.pejabatPenilai);
      }
      if (resUsers && resUsers.ok) {
        const json = await resUsers.json();
        setAllUsers(json.users || []);
      }
      if (resSettings.ok) {
        const json = await resSettings.json();
        if (json.settings?.kua_instansi) setKuaName(json.settings.kua_instansi);
      }
    } catch {
      showToast('error', 'Gagal memuat data laporan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    if (activeTemplate === 'template1') {
      setCustomCetakDate(`${lastDay} ${monthNames[selectedMonth - 1]} ${selectedYear}`);
    } else {
      setCustomCetakDate(`Malang, ${lastDay} ${monthNames[selectedMonth - 1]} ${selectedYear}`);
    }
  }, [selectedMonth, selectedYear, activeTemplate, kuaName]);

  useEffect(() => {
    if (token && selectedUserId) {
      fetchReportData();
    }
  }, [token, selectedUserId, selectedMonth, selectedYear]);

  const handleExportPdf = async () => {
    if (!targetUser) return;
    showToast('info', 'Menyiapkan berkas PDF...');
    try {
      if (activeTemplate === 'template1') {
        await exportLaporanKinerjaPdf(targetUser.id, selectedMonth, selectedYear, customCetakDate);
      } else {
        await exportRekapTukinPdf(targetUser.id, selectedMonth, selectedYear, totalHariKerja, customCetakDate);
      }
      showToast('success', 'Berkas PDF berhasil diunduh.');
    } catch {
      showToast('error', 'Gagal membuat PDF.');
    }
  };

  const handleExportWord = async () => {
    if (!targetUser || !pejabatPenilai) return;
    showToast('info', 'Mengunduh berkas Word (.docx)...');
    try {
      if (activeTemplate === 'template1') {
        await exportLaporanKinerjaWord(targetUser, selectedMonth, selectedYear, activities, pejabatPenilai, customCetakDate);
      } else {
        await exportRekapTukinWord(targetUser, selectedMonth, selectedYear, pejabatPenilai, totalHariKerja, customCetakDate);
      }
      showToast('success', 'Berkas Word berhasil diunduh.');
    } catch {
      showToast('error', 'Gagal mengunduh berkas Word. Coba lagi.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Export Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <span>Cetak & Ekspor Laporan Kinerja KUA</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pratinjau resmi dokumen Template 1 & Template 2 dan unduh langsung dalam format PDF atau Word.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPdf}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
          </button>

          <button
            onClick={handleExportWord}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Ekspor Word (.docx)</span>
          </button>

        </div>
      </div>

      {/* Filter Options & Template Switcher */}
      <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        
        {/* Row 1: Template Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full md:w-auto">
            <button
              onClick={() => setActiveTemplate('template1')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTemplate === 'template1'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Template 1: Laporan Kinerja Harian
            </button>

            <button
              onClick={() => setActiveTemplate('template2')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTemplate === 'template2'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Template 2: Rekap Tukin Bulanan
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium hidden lg:block">
            Pilih format template laporan yang ingin dicetak atau diekspor.
          </div>
        </div>

        {/* Row 2: Filter Inputs Grid / Flex Wrap */}
        <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          
          {/* Admin User Selector */}
          {user?.role === 'admin' && allUsers.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 font-semibold whitespace-nowrap">Pegawai:</span>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                {allUsers.map(u => (
                  <option key={u.id} value={u.id} className="dark:bg-slate-800">
                    {u.nama} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month / Year Selector */}
          <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-semibold mr-1 whitespace-nowrap">Periode:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m} className="dark:bg-slate-800">
                  {new Date(2026, m - 1, 1).toLocaleString('id-ID', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="dark:bg-slate-800">{y}</option>
              ))}
            </select>
          </div>

          {/* Total Hari Kehadiran (khusus Template 2) */}
          {activeTemplate === 'template2' && (
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 font-semibold text-[11px] whitespace-nowrap">Kehadiran:</span>
              <input
                type="number"
                min={1}
                max={31}
                value={totalHariKerja}
                onChange={e => setTotalHariKerja(Math.max(1, Number(e.target.value) || 0))}
                className="w-12 bg-transparent border-none text-slate-800 dark:text-slate-200 font-bold focus:outline-none text-center"
              />
              <span className="text-slate-400 font-medium text-[11px] whitespace-nowrap">Hari</span>
            </div>
          )}

          {/* Tanggal Laporan Cetak Manual */}
          <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 sm:flex-initial min-w-[220px]">
            <span className="text-slate-500 font-semibold text-[11px] whitespace-nowrap">Tgl Laporan:</span>
            <input
              type="text"
              value={customCetakDate}
              onChange={e => setCustomCetakDate(e.target.value)}
              placeholder="Kota, Tanggal Laporan"
              className="w-full bg-transparent border-none text-slate-800 dark:text-slate-200 font-semibold focus:outline-none text-xs"
            />
          </div>

        </div>

      </div>

      {/* Printable Preview Renderer */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          Menyiapkan lembar dokumen laporan...
        </div>
      ) : targetUser && pejabatPenilai ? (
        <div className="p-2 sm:p-6 bg-slate-200 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 overflow-x-auto">
          {activeTemplate === 'template1' ? (
            <TemplateLaporanKinerja
              user={targetUser}
              month={selectedMonth}
              year={selectedYear}
              activities={activities}
              pejabatPenilai={pejabatPenilai}
              customCetakDate={customCetakDate}
            />
          ) : (
            <TemplateRekapTukin
              user={targetUser}
              month={selectedMonth}
              year={selectedYear}
              pejabatPenilai={pejabatPenilai}
              totalHariKerja={totalHariKerja}
              customCetakDate={customCetakDate}
              kuaName={kuaName}
            />
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-rose-500">
          Data Pejabat Penilai atau Pegawai tidak ditemukan.
        </div>
      )}

    </div>
  );
};
