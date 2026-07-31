import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KuaDailyData } from '../../types/index';
import { useYearOptions } from '../../utils/years';
import {
  Plus,
  Edit2,
  Trash2,
  Filter,
  X,
  Save,
  CalendarDays,
  Settings,
  Check,
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';

interface Props {
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export interface MasterColumn {
  id: string;
  key: string;
  label: string;
  shortLabel: string;
}

export const DEFAULT_COLUMNS: MasterColumn[] = [
  { id: 'col-1', key: 'pendaftaran_nikah_kantor', label: 'Pendaftaran Nikah di Kantor', shortLabel: 'Daftar Kantor' },
  { id: 'col-2', key: 'pendaftaran_nikah_luar_kantor', label: 'Pendaftaran Nikah di Luar Kantor', shortLabel: 'Daftar Luar' },
  { id: 'col-3', key: 'pelaksanaan_nikah_kantor', label: 'Pelaksanaan Nikah di Kantor', shortLabel: 'Akad Kantor' },
  { id: 'col-4', key: 'pelaksanaan_nikah_luar_kantor', label: 'Pelaksanaan Nikah di Luar Kantor', shortLabel: 'Akad Luar' },
  { id: 'col-5', key: 'pelaksanaan_bimwin', label: 'Pelaksanaan Bimwin (Pasang)', shortLabel: 'Bimwin' },
  { id: 'col-6', key: 'duplikat_buku_nikah', label: 'Pelayanan Duplikat Buku Nikah', shortLabel: 'Duplikat' },
  { id: 'col-7', key: 'surat_rekomendasi_nikah', label: 'Penerbitan Surat Rekomendasi Nikah', shortLabel: 'Rekomendasi' },
  { id: 'col-8', key: 'legalisir_buku_nikah', label: 'Pelayanan Legalisir Buku Nikah', shortLabel: 'Legalisir' },
  { id: 'col-9', key: 'surat_keluar', label: 'Pengelolaan & Pengiriman Surat Keluar', shortLabel: 'Surat Keluar' },
  { id: 'col-10', key: 'pelaksanaan_wakaf', label: 'Pelaksanaan & Pelayanan Akta Wakaf', shortLabel: 'Wakaf' },
];

export function getMasterColumns(): MasterColumn[] {
  const saved = localStorage.getItem('kua_master_columns');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback
    }
  }
  return DEFAULT_COLUMNS;
}

export const KuaDailyManagement: React.FC<Props> = ({ showToast }) => {
  const { token } = useAuth();
  const yearOptions = useYearOptions(token);
  const [dataList, setDataList] = useState<KuaDailyData[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState<number>(7); // July
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Columns Configuration State
  const [columns, setColumns] = useState<MasterColumn[]>(getMasterColumns);

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnLabel, setEditingColumnLabel] = useState('');

  // Single Item Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Record<string, any> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const updateColumnsState = (newCols: MasterColumn[]) => {
    setColumns(newCols);
    localStorage.setItem('kua_master_columns', JSON.stringify(newCols));
    window.dispatchEvent(new Event('kua_master_columns_updated'));
  };

  const fetchDailyData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kua-daily?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || [];
        setDataList(list);
      }
    } catch {
      showToast('error', 'Gagal memuat data harian KUA.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDailyData();
  }, [token, selectedMonth, selectedYear]);

  // Handle Adding New Column / Theme
  const handleAddColumn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newColumnLabel.trim()) {
      showToast('error', 'Nama tema pekerjaan master wajib diisi.');
      return;
    }
    const slugKey = newColumnLabel
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');

    // Prevent duplicate keys
    const finalKey = columns.some(c => c.key === slugKey)
      ? `${slugKey}_${Date.now().toString().slice(-4)}`
      : slugKey;

    const newCol: MasterColumn = {
      id: `col-${Date.now()}`,
      key: finalKey,
      label: newColumnLabel.trim(),
      shortLabel: newColumnLabel.trim().slice(0, 15)
    };

    const updatedCols = [...columns, newCol];
    updateColumnsState(updatedCols);
    setNewColumnLabel('');
    showToast('success', `Tema pekerjaan "${newColumnLabel}" berhasil ditambahkan ke Master Data!`);
  };

  // Handle Editing Column Label
  const handleSaveEditColumn = (colId: string) => {
    if (!editingColumnLabel.trim()) return;
    const updatedCols = columns.map(c =>
      c.id === colId
        ? { ...c, label: editingColumnLabel.trim(), shortLabel: editingColumnLabel.trim().slice(0, 15) }
        : c
    );
    updateColumnsState(updatedCols);
    setEditingColumnId(null);
    setEditingColumnLabel('');
    showToast('success', 'Nama tema pekerjaan master berhasil diperbarui.');
  };

  // Handle Deleting Column
  const handleDeleteColumn = (colId: string) => {
    if (columns.length <= 1) {
      showToast('error', 'Minimal harus ada 1 tema pekerjaan master.');
      return;
    }
    const updatedCols = columns.filter(c => c.id !== colId);
    updateColumnsState(updatedCols);
    showToast('info', 'Tema pekerjaan berhasil dihapus dari master data.');
  };

  const handleResetColumns = () => {
    updateColumnsState(DEFAULT_COLUMNS);
    showToast('info', 'Tema pekerjaan master dikembalikan ke standar awal.');
  };

  // Single Modal Handlers
  const handleOpenAddModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const initialObj: Record<string, any> = { tanggal: todayStr };
    columns.forEach(col => {
      initialObj[col.key] = 0;
    });
    setEditingData(initialObj);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: KuaDailyData) => {
    const obj: Record<string, any> = { ...item };
    columns.forEach(col => {
      if (obj[col.key] === undefined) obj[col.key] = 0;
    });
    setEditingData(obj);
    setIsModalOpen(true);
  };

  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingData || !editingData.tanggal) {
      showToast('error', 'Tanggal wajib diisi.');
      return;
    }

    try {
      const res = await fetch('/api/kua-daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingData)
      });

      if (res.ok) {
        showToast('success', 'Data Harian KUA berhasil disimpan.');
        setIsModalOpen(false);
        setEditingData(null);
        fetchDailyData();
      } else {
        const errJson = await res.json();
        showToast('error', errJson.error || 'Gagal menyimpan data.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan koneksi.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/kua-daily/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('success', 'Data harian berhasil dihapus.');
        setDeleteConfirmId(null);
        fetchDailyData();
      } else {
        showToast('error', 'Gagal menghapus data.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan koneksi.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-emerald-500" />
            <span>Data Master Statistik KUA Harian</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pusat acuan data harian KUA dan kelola tema pekerjaan standar yang terintegrasi dengan log laporan staf.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month / Year Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-xs font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent border-none text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
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
              className="bg-transparent border-none text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {yearOptions.map(y => (
                <option key={y} value={y} className="dark:bg-slate-800">{y}</option>
              ))}
            </select>
          </div>

          {/* Manage Columns Button */}
          <button
            onClick={() => setIsColumnModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all border border-slate-200 dark:border-slate-700"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Kelola Kolom / Tema Master ({columns.length})</span>
          </button>

          {/* Add Data Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data Harian</span>
          </button>
        </div>
      </div>

      {/* Standar Table View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-3 whitespace-nowrap">Tanggal</th>
                {columns.map(col => (
                  <th key={col.id} className="p-3 text-center whitespace-nowrap min-w-[100px]" title={col.label}>
                    {col.shortLabel}
                  </th>
                ))}
                <th className="p-3 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 2} className="p-8 text-center text-slate-400">
                    Memuat data statistik harian KUA...
                  </td>
                </tr>
              ) : dataList.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="p-8 text-center text-slate-400 italic">
                    Belum ada data harian KUA untuk bulan ini. Klik "Tambah Data Harian" di kanan atas.
                  </td>
                </tr>
              ) : (
                dataList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {item.tanggal}
                    </td>
                    {columns.map(col => {
                      const val = (item as any)[col.key] ?? 0;
                      return (
                        <td
                          key={col.id}
                          className={`p-3 text-center font-bold ${
                            val > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg mr-1"
                        title="Edit Data"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirmId === item.id ? (
                        <div className="inline-flex items-center space-x-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-300 dark:border-rose-800">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                          >
                            Ya
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Kelola Kolom Master Pekerjaan */}
      {isColumnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-emerald-500" />
                  <span>Pengaturan Kelola Kolom / Tema Pekerjaan Master</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tambah, edit nama, atau hapus tema pekerjaan master. Hasilnya otomatis tersinkron ke log harian staf.
                </p>
              </div>
              <button
                onClick={() => setIsColumnModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Tambah Kolom Baru */}
            <form onSubmit={handleAddColumn} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>+ Tambah Tema Pekerjaan Master Baru</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newColumnLabel}
                  onChange={e => setNewColumnLabel(e.target.value)}
                  placeholder="Misal: Bimbingan BP4 / Pelayanan Sertifikasi Halal..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 shrink-0 flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </form>

            {/* List Existing Columns CRUD */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Daftar Tema Pekerjaan Master Terdaftar ({columns.length}):
              </span>
              {columns.map((col, index) => (
                <div
                  key={col.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  {editingColumnId === col.id ? (
                    <div className="flex items-center space-x-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingColumnLabel}
                        onChange={e => setEditingColumnLabel(e.target.value)}
                        className="flex-1 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none"
                      />
                      <button
                        onClick={() => handleSaveEditColumn(col.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
                        title="Simpan Perubahan"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingColumnId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        title="Batal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate" title={col.label}>{col.label}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">Key: {col.key}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingColumnId(col.id);
                            setEditingColumnLabel(col.label);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg"
                          title="Edit Nama Tema Pekerjaan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteColumn(col.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg"
                          title="Hapus Tema Pekerjaan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleResetColumns}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Standar Awal</span>
              </button>

              <button
                onClick={() => setIsColumnModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Item Add/Edit Modal */}
      {isModalOpen && editingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingData.id ? 'Edit Data Master KUA Harian' : 'Tambah Data Master KUA Harian'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Kegiatan (YYYY-MM-DD) *
                </label>
                <input
                  type="date"
                  value={editingData.tanggal || ''}
                  onChange={e => setEditingData({ ...editingData, tanggal: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {columns.map(col => (
                  <div key={col.id}>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {col.label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingData[col.key] ?? 0}
                      onChange={e => setEditingData({ ...editingData, [col.key]: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
