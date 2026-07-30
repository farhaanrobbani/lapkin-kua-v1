import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StaffActivity, KuaDailyData, UserActivityTemplatesMap } from '../../types/index';
import { MasterColumn, getMasterColumns } from '../admin/KuaDailyManagement';
import { UserTemplateSettings } from './UserTemplateSettings';
import {
  FileSpreadsheet,
  Plus,
  Download,
  Trash2,
  Edit2,
  Save,
  X,
  Sparkles,
  Filter,
  CheckSquare,
  Square,
  AlertCircle,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface Props {
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

const DEFAULT_DESCRIPTIONS: Record<string, { label: string; pekerjaan: string }> = {
  pendaftaran_nikah_kantor: {
    label: 'Pendaftaran dan Pemeriksaan Nikah di Kantor',
    pekerjaan: 'Menerima dan memeriksa kelengkapan berkas pendaftaran nikah calon pengantin serta mencatat pada SIMKAH.'
  },
  pendaftaran_nikah_luar_kantor: {
    label: 'Pendaftaran dan Pemeriksaan Nikah di Luar Kantor',
    pekerjaan: 'Memeriksa keabsahan syarat administrasi pendaftaran nikah luar kantor dan memverifikasi wali nikah.'
  },
  pelaksanaan_nikah_kantor: {
    label: 'Pelaksanaan dan Pengawasan Akad Nikah di Kantor',
    pekerjaan: 'Mendampingi pelaksanaan akad nikah di aula KUA, memandu pembacaan ikrar, dan mengesahkan akta nikah.'
  },
  pelaksanaan_nikah_luar_kantor: {
    label: 'Pelaksanaan Nikah di Luar Kantor / Bedhol',
    pekerjaan: 'Melaksanakan pengawasan akad nikah di luar kantor, mencatat ijab kabul, dan menyerahkan Buku Nikah.'
  },
  pelaksanaan_bimwin: {
    label: 'Pelaksanaan Bimbingan Perkawinan (Bimwin)',
    pekerjaan: 'Memberikan bimbingan perkawinan dan kesehatan reproduksi bagi calon pengantin.'
  },
  duplikat_buku_nikah: {
    label: 'Pelayanan Duplikat Buku Nikah',
    pekerjaan: 'Pemeriksaan berkas permohonan penerbitan duplikat buku nikah dan verifikasi register akta nikah.'
  },
  surat_rekomendasi_nikah: {
    label: 'Pelayanan Surat Rekomendasi Nikah',
    pekerjaan: 'Memeriksa kelengkapan surat pengantar desa/kelurahan dan mencetak Surat Rekomendasi Nikah.'
  },
  legalisir_buku_nikah: {
    label: 'Pelayanan Legalisir Buku Nikah',
    pekerjaan: 'Memeriksa keaslian dokumen buku nikah, mencocokkan dengan register, dan membubuhkan stempel legalisir.'
  },
  surat_keluar: {
    label: 'Pengelolaan, Pencatatan, dan Pengiriman Surat Keluar',
    pekerjaan: 'Mencatat nomor agenda surat keluar, mengarsipkan salinan, dan mengelompokkan surat dinas.'
  },
  pelaksanaan_wakaf: {
    label: 'Pelaksanaan & Pelayanan Akta Wakaf',
    pekerjaan: 'Melakukan verifikasi berkas permohonan ikrar wakaf dan mengagendakan prosesi ikrar wakaf.'
  }
};

interface ImportItemSelection {
  tanggal: string;
  key: string;
  field: string;
  label: string;
  pekerjaan: string;
  total_jumlah: number;
  selected: boolean;
}

export const StaffActivityManagement: React.FC<Props> = ({ showToast }) => {
  const { token } = useAuth();
  const [activities, setActivities] = useState<StaffActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const [masterColumns, setMasterColumns] = useState<MasterColumn[]>(getMasterColumns);

  const [userTemplatesMap, setUserTemplatesMap] = useState<UserActivityTemplatesMap>({});

  useEffect(() => {
    const handleMasterColumnsUpdated = () => {
      setMasterColumns(getMasterColumns());
    };
    window.addEventListener('kua_master_columns_updated', handleMasterColumnsUpdated);
    return () => window.removeEventListener('kua_master_columns_updated', handleMasterColumnsUpdated);
  }, []);

  useEffect(() => {
    fetchUserTemplates();
  }, [token]);

  const fetchUserTemplates = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user-templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setUserTemplatesMap(json.map || {});
      }
    } catch {
      // silent fail
    }
  };

  const [selectedMonth, setSelectedMonth] = useState<number>(7); // July
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Single item modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Partial<StaffActivity> & { activity_type_key?: string } | null>(null);

  // Admin import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMonth, setImportMonth] = useState<number>(7);
  const [importYear, setImportYear] = useState<number>(2026);
  const [categoryFilter, setCategoryFilter] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [importSelections, setImportSelections] = useState<ImportItemSelection[]>([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);

  // Delete inline confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const columnFilterOptions = [
    { id: 'semua', label: 'Semua Kolom' },
    ...masterColumns.map(c => ({
      id: c.key,
      label: c.shortLabel || c.label
    }))
  ];

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff-activities?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setActivities(json.activities || []);
      }
    } catch {
      showToast('error', 'Gagal memuat log kegiatan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchActivities();
  }, [token, selectedMonth, selectedYear]);

  // Fetch admin monthly daily data for import modal
  const fetchAdminDataForMonth = async (monthVal: number, yearVal: number) => {
    setLoadingAdminData(true);
    try {
      const res = await fetch(`/api/kua-daily?month=${monthVal}&year=${yearVal}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const dailyList: KuaDailyData[] = json.data || json.dailyData || [];

        const currentCols = getMasterColumns();
        const selections: ImportItemSelection[] = [];

        dailyList.forEach(data => {
          currentCols.forEach(col => {
            const qty = data && typeof (data as any)[col.key] === 'number' ? Number((data as any)[col.key]) : 0;
            if (qty > 0) {
              const userTemplate = userTemplatesMap[col.key];
              const defaultDesc = userTemplate && userTemplate.pekerjaan
                ? { label: col.label, pekerjaan: userTemplate.pekerjaan }
                : (DEFAULT_DESCRIPTIONS[col.key] || {
                    label: col.label,
                    pekerjaan: `Melaksanakan pelayanan dan pencatatan ${col.label.toLowerCase()}`
                  });
              selections.push({
                tanggal: data.tanggal,
                key: col.key,
                field: col.key,
                label: defaultDesc.label,
                pekerjaan: defaultDesc.pekerjaan,
                total_jumlah: qty,
                selected: true
              });
            }
          });
        });

        // Sort by tanggal
        selections.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
        setImportSelections(selections);
      } else {
        setImportSelections([]);
      }
    } catch {
      showToast('error', 'Gagal memuat data master dari admin.');
      setImportSelections([]);
    } finally {
      setLoadingAdminData(false);
    }
  };

  const handleOpenImportModal = () => {
    setImportMonth(selectedMonth);
    setImportYear(selectedYear);
    fetchAdminDataForMonth(selectedMonth, selectedYear);
    setIsImportModalOpen(true);
  };

  const handleImportMonthYearChange = (m: number, y: number) => {
    setImportMonth(m);
    setImportYear(y);
    fetchAdminDataForMonth(m, y);
  };

  const handleToggleSelection = (index: number) => {
    setImportSelections(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  const handleSelectAll = (selectStatus: boolean) => {
    setImportSelections(prev => prev.map(s => ({ ...s, selected: selectStatus })));
  };

  const handleSelectFiltered = (selectStatus: boolean) => {
    const keysToChange = new Set(filteredSelections.map(f => `${f.tanggal}-${f.key}`));
    setImportSelections(prev => prev.map(item => {
      if (keysToChange.has(`${item.tanggal}-${item.key}`)) {
        return { ...item, selected: selectStatus };
      }
      return item;
    }));
  };

  const handleUpdateSelectionField = (index: number, field: 'label' | 'pekerjaan' | 'total_jumlah', value: any) => {
    setImportSelections(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveImportedItems = async () => {
    const selectedItems = importSelections.filter(s => s.selected);
    if (selectedItems.length === 0) {
      showToast('error', 'Pilih minimal satu tema pekerjaan yang menjadi tugas Anda.');
      return;
    }

    const payload = selectedItems.map(item => ({
      tanggal: item.tanggal,
      kegiatan: item.label,
      pekerjaan: item.pekerjaan,
      activity_type_key: item.key,
      total_jumlah: item.total_jumlah
    }));

    try {
      const res = await fetch('/api/staff-activities/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: payload })
      });

      if (res.ok) {
        showToast('success', `${selectedItems.length} pekerjaan berhasil ditambahkan ke laporan Anda.`);
        setIsImportModalOpen(false);
        fetchActivities();
      } else {
        const json = await res.json();
        showToast('error', json.error || 'Gagal menyimpan pekerjaan dari admin.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan koneksi.');
    }
  };

  // Single Item Modal Handlers
  const handleOpenAddModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const cols = getMasterColumns();
    const defaultCol = cols[0] || { key: 'pendaftaran_nikah_kantor', label: 'Pendaftaran Nikah di Kantor' };
    const defaultKey = defaultCol.key;
    const def = DEFAULT_DESCRIPTIONS[defaultKey] || {
      label: defaultCol.label,
      pekerjaan: `Melaksanakan pelayanan dan pencatatan ${defaultCol.label.toLowerCase()}`
    };
    setEditingActivity({
      tanggal: todayStr,
      pekerjaan: def.pekerjaan,
      activity_type_key: defaultKey,
      kegiatan: defaultCol.label,
      total_jumlah: 1
    });
    setIsModalOpen(true);
  };

  const handleActivityTypeChange = async (typeKey: string) => {
    if (!editingActivity) return;
    if (typeKey === 'libur') {
      setEditingActivity({
        ...editingActivity,
        activity_type_key: 'libur',
        kegiatan: 'Hari Libur / Libur Nasional',
        pekerjaan: '-',
        total_jumlah: ''
      });
      return;
    }

    if (typeKey === 'lainnya') {
      setEditingActivity({
        ...editingActivity,
        activity_type_key: 'lainnya',
        kegiatan: editingActivity.kegiatan || 'Kegiatan Umum KUA',
        total_jumlah: 1
      });
      return;
    }

    const matchedCol = masterColumns.find(c => c.key === typeKey);
    const def = DEFAULT_DESCRIPTIONS[typeKey] || (matchedCol ? {
      label: matchedCol.label,
      pekerjaan: `Melaksanakan pelayanan dan pencatatan ${matchedCol.label.toLowerCase()}`
    } : null);

    // Fetch master admin volume for this date if exists
    let fetchedQty = 1;
    if (editingActivity.tanggal && typeKey) {
      try {
        const res = await fetch(`/api/kua-daily/by-date?tanggal=${editingActivity.tanggal}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && typeof json.data[typeKey] === 'number') {
            fetchedQty = json.data[typeKey] || 1;
          }
        }
      } catch {
        // ignore
      }
    }

    setEditingActivity({
      ...editingActivity,
      activity_type_key: typeKey,
      kegiatan: matchedCol?.label || 'Pekerjaan KUA',
      pekerjaan: editingActivity.pekerjaan || def?.pekerjaan || `Melaksanakan ${matchedCol?.label?.toLowerCase() || 'pekerjaan'}`,
      total_jumlah: fetchedQty
    });
  };

  const handleDateChange = async (newDate: string) => {
    if (!editingActivity) return;
    if (editingActivity.activity_type_key === 'libur') {
      setEditingActivity({
        ...editingActivity,
        tanggal: newDate,
        pekerjaan: '-',
        total_jumlah: ''
      });
      return;
    }

    let fetchedQty = editingActivity.total_jumlah || 1;

    if (editingActivity.activity_type_key && editingActivity.activity_type_key !== 'lainnya') {
      const fieldKey = editingActivity.activity_type_key;
      try {
        const res = await fetch(`/api/kua-daily/by-date?tanggal=${newDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && typeof json.data[fieldKey] === 'number') {
            fetchedQty = json.data[fieldKey];
          }
        }
      } catch {
        // ignore
      }
    }

    setEditingActivity({
      ...editingActivity,
      tanggal: newDate,
      total_jumlah: fetchedQty
    });
  };

  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !editingActivity.tanggal || !editingActivity.kegiatan || !editingActivity.pekerjaan) {
      showToast('error', 'Tanggal, Rincian Pekerjaan, dan Tema Kegiatan wajib diisi.');
      return;
    }

    const payload = {
      ...editingActivity,
      pekerjaan: editingActivity.activity_type_key === 'libur' ? '-' : editingActivity.pekerjaan,
      total_jumlah: editingActivity.activity_type_key === 'libur'
        ? 0
        : (Number(editingActivity.total_jumlah) || 1)
    };

    const isEdit = !!editingActivity.id;
    const url = isEdit ? `/api/staff-activities/${editingActivity.id}` : '/api/staff-activities';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('success', 'Log pekerjaan berhasil disimpan ke laporan.');
        setIsModalOpen(false);
        setEditingActivity(null);
        fetchActivities();
      } else {
        const json = await res.json();
        showToast('error', json.error || 'Gagal menyimpan log pekerjaan.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan koneksi.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/staff-activities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('success', 'Log kegiatan berhasil dihapus.');
        setDeleteConfirmId(null);
        fetchActivities();
      } else {
        showToast('error', 'Gagal menghapus log kegiatan.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan koneksi.');
    }
  };

  const filteredSelections = importSelections.filter(item => {
    let matchCat = true;
    if (categoryFilter !== 'semua') {
      matchCat = item.key === categoryFilter;
    }

    let matchSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      matchSearch = item.tanggal.includes(q) || item.label.toLowerCase().includes(q) || item.pekerjaan.toLowerCase().includes(q);
    }

    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <span>Log Kegiatan & Pekerjaan Staf</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pilih data pekerjaan yang telah diinput admin untuk sebulan, lalu buat rincian kalimat pekerjaan Anda.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 pl-1" />
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

          <button
            onClick={handleOpenImportModal}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Ambil Data dari Admin (1 Bulan)</span>
          </button>

          <UserTemplateSettings
            showToast={showToast}
            onTemplatesUpdated={(map) => setUserTemplatesMap(map)}
          />

          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Pekerjaan Baru</span>
          </button>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3 w-28">Tanggal</th>
                <th className="p-3">Tema Kegiatan (Master)</th>
                <th className="p-3">Rincian Uraian Pekerjaan</th>
                <th className="p-3 w-28 text-center">Volume Berkas</th>
                <th className="p-3 w-28 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Memuat log pekerjaan...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    Belum ada log kegiatan tercatat untuk bulan ini. Klik "Ambil Data dari Admin (1 Bulan)" atau "Buat Pekerjaan Baru".
                  </td>
                </tr>
              ) : (
                activities.map((act, index) => (
                  <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {act.tanggal}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {act.kegiatan}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      {act.pekerjaan}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {act.total_jumlah} Berkas
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingActivity({ ...act });
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg mr-1"
                        title="Edit Log Laporan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {deleteConfirmId === act.id ? (
                        <div className="inline-flex items-center space-x-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-300 dark:border-rose-800">
                          <button
                            onClick={() => handleDelete(act.id)}
                            className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                          >
                            Ya, Hapus
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
                          onClick={() => setDeleteConfirmId(act.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg"
                          title="Hapus Log"
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

      {/* Modal: Import Pekerjaan Dari Admin (1 Bulan) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Download className="w-5 h-5 text-blue-500" />
                  <span>Ambil Data Pekerjaan Master Admin (Bulanan)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data master kegiatan dari admin disajikan untuk seluruh bulan. Centang pekerjaan yang sesuai dengan tugas Anda.
                </p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Filter Bulan/Tahun, Cari Tanggal/Topik & Kategori */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bulan:</span>
                  <select
                    value={importMonth}
                    onChange={e => handleImportMonthYearChange(Number(e.target.value), importYear)}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>
                        {new Date(2026, m - 1, 1).toLocaleString('id-ID', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={importYear}
                    onChange={e => handleImportMonthYearChange(importMonth, Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                  >
                    {[2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari tanggal atau keyword..."
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs outline-none w-36 sm:w-44"
                  />
                </div>

                {/* Filter Kategori Kolom Master Data Spreadsheet */}
                <div className="flex items-center space-x-1 flex-wrap gap-1">
                  {columnFilterOptions.map(col => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setCategoryFilter(col.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        categoryFilter === col.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk Selection Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2 pt-1">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  Ditemukan: <strong className="text-slate-900 dark:text-white">{filteredSelections.length}</strong> entri master (Dipilih: <strong className="text-emerald-600 dark:text-emerald-400">{importSelections.filter(s => s.selected).length}</strong> / {importSelections.length})
                </span>
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  <button
                    type="button"
                    onClick={() => handleSelectFiltered(true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-500/20 text-[11px]"
                  >
                    Pilih Tampilan Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectFiltered(false)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-500/20 text-[11px]"
                  >
                    Batal Tampilan Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-500/20 text-[11px]"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-300 text-[11px]"
                  >
                    Batal Semua
                  </button>
                </div>
              </div>

              {loadingAdminData ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Mengambil data master kegiatan admin untuk seluruh bulan...
                </div>
              ) : importSelections.length === 0 ? (
                <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-3 text-amber-700 dark:text-amber-400 text-xs">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Belum Ada Data Master Admin di Bulan Ini</p>
                    <p className="text-[11px] mt-0.5">
                      Admin belum menginput data kegiatan KUA untuk bulan ini. Silakan buat pekerjaan baru secara manual.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredSelections.map((item) => {
                    const realIndex = importSelections.findIndex(s => s.tanggal === item.tanggal && s.key === item.key);
                    return (
                      <div
                        key={`${item.tanggal}-${item.key}`}
                        className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                          item.selected
                            ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => handleToggleSelection(realIndex)}
                        >
                          <div className="flex items-center space-x-2.5">
                            {item.selected ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400 shrink-0" />
                            )}
                            <div>
                              <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                {item.label}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500">
                                Tanggal: {item.tanggal}
                              </span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                            Volume: {item.total_jumlah} Berkas
                          </span>
                        </div>

                        {item.selected && (
                          <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                                Kalimat Rincian Uraian Pekerjaan Saya:
                              </label>
                              <textarea
                                rows={2}
                                value={item.pekerjaan}
                                onChange={e => handleUpdateSelectionField(realIndex, 'pekerjaan', e.target.value)}
                                placeholder="Tuliskan uraian rincian pekerjaan yang Anda laksanakan..."
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveImportedItems}
                  disabled={importSelections.filter(s => s.selected).length === 0}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-blue-600/20 flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pekerjaan Terpilih ({importSelections.filter(s => s.selected).length}) ke Laporan Saya</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Single Item Form: Alur Sesuai Permintaan User */}
      {isModalOpen && editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingActivity.id ? 'Edit Log Pekerjaan Laporan' : 'Buat Log Pekerjaan Staf'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Isi rincian pekerjaan Anda dahulu, lalu hubungkan dengan tema data master admin.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="space-y-4">
              {/* Langkah 1: Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Tanggal Pelaksanaan Pekerjaan *
                </label>
                <input
                  type="date"
                  value={editingActivity.tanggal || ''}
                  onChange={e => handleDateChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                />
              </div>

              {/* Langkah 2: Rincian Pekerjaan (Tulis dulu) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2. Tuliskan Kalimat Rincian Uraian Pekerjaan Anda *
                </label>
                <textarea
                  rows={3}
                  value={editingActivity.pekerjaan || ''}
                  onChange={e => setEditingActivity({ ...editingActivity, pekerjaan: e.target.value })}
                  placeholder="Misal: Memeriksa dan merekap berkas permohonan penerbitan duplikat buku nikah serta mencocokkan stempel register akta nikah..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Langkah 3: Pilih Tema Pekerjaan dari Data Master */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  3. Pilih Tema Pekerjaan (Dari Master Data KUA) *
                </label>
                <select
                  value={editingActivity.activity_type_key || 'lainnya'}
                  onChange={e => handleActivityTypeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="libur">🏖️ Libur / Hari Libur (Volume Berkas Kosong / 0)</option>
                  {masterColumns.map((col) => (
                    <option key={col.key} value={col.key}>
                      {col.label}
                    </option>
                  ))}
                  <option value="lainnya">Kegiatan / Pekerjaan Lainnya (Manual)</option>
                </select>
              </div>

              {/* Judul Kegiatan (Dapat disesuaikan) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Tema Kegiatan Laporan:
                </label>
                <input
                  type="text"
                  value={editingActivity.kegiatan || ''}
                  onChange={e => setEditingActivity({ ...editingActivity, kegiatan: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                />
              </div>

              {/* Langkah 4: Volume / Jumlah diambil dari Data Master */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    4. Volume Berkas Pekerjaan {editingActivity.activity_type_key === 'libur' ? '(Opsional / Boleh Kosong)' : '*'}
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{editingActivity.activity_type_key === 'libur' ? 'Hari Libur / Tanpa Berkas' : 'Otomatis Diambil dari Log Master Admin'}</span>
                  </span>
                </div>
                <input
                  type="text"
                  value={editingActivity.activity_type_key === 'libur' ? (editingActivity.total_jumlah ?? '') : (editingActivity.total_jumlah ?? '')}
                  onChange={e => setEditingActivity({ ...editingActivity, total_jumlah: e.target.value === '' ? '' : Number(e.target.value) })}
                  required={editingActivity.activity_type_key !== 'libur'}
                  placeholder={editingActivity.activity_type_key === 'libur' ? 'Kosong / -' : '1'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none"
                />
                {editingActivity.activity_type_key === 'libur' && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    * Untuk pekerjaan Hari Libur, rincian otomatis terisi dengan "-" dan volume berkas dikosongkan.
                  </p>
                )}
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
                  <span>Simpan ke Laporan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
