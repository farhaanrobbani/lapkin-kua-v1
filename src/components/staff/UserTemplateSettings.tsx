import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MasterColumn, getMasterColumns, syncMasterColumnsFromServer } from '../admin/KuaDailyManagement';
import { UserActivityTemplatesMap } from '../../types/index';
import {
  FileText,
  X,
  Save,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface Props {
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onTemplatesUpdated: (map: UserActivityTemplatesMap) => void;
}

interface TemplateForm {
  activity_type_key: string;
  masterLabel: string;
  kegiatan: string;
  pekerjaan: string;
}

export const UserTemplateSettings: React.FC<Props> = ({ showToast, onTemplatesUpdated }) => {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [masterColumns, setMasterColumns] = useState<MasterColumn[]>(getMasterColumns);
  const [templates, setTemplates] = useState<TemplateForm[]>([]);

  useEffect(() => {
    const handleColumnsUpdated = () => {
      setMasterColumns(getMasterColumns());
    };
    window.addEventListener('kua_master_columns_updated', handleColumnsUpdated);
    return () => window.removeEventListener('kua_master_columns_updated', handleColumnsUpdated);
  }, []);

  useEffect(() => {
    if (token) {
      syncMasterColumnsFromServer(token).then(cols => setMasterColumns(cols));
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user-templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const map: Record<string, { kegiatan: string; pekerjaan: string }> = json.map || {};
        const forms: TemplateForm[] = masterColumns.map(col => ({
          activity_type_key: col.key,
          masterLabel: col.label,
          kegiatan: map[col.key]?.kegiatan || col.label,
          pekerjaan: map[col.key]?.pekerjaan || ''
        }));
        setTemplates(forms);
      }
    } catch {
      showToast('error', 'Gagal memuat template kalimat.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const filled = templates.filter(t => t.kegiatan.trim().length > 0 && t.pekerjaan.trim().length > 0);
    if (filled.length === 0) {
      showToast('error', 'Isi minimal satu judul tema kegiatan dan rincian uraian pekerjaan untuk disimpan.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/user-templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          templates: filled.map(t => ({
            activity_type_key: t.activity_type_key,
            kegiatan: t.kegiatan,
            pekerjaan: t.pekerjaan
          }))
        })
      });

      if (res.ok) {
        showToast('success', `${filled.length} template kalimat berhasil disimpan.`);
        const mapRes = await fetch('/api/user-templates', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (mapRes.ok) {
          const mapJson = await mapRes.json();
          onTemplatesUpdated(mapJson.map || {});
        }
        setIsOpen(false);
      } else {
        const json = await res.json();
        showToast('error', json.error || 'Gagal menyimpan template.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan koneksi.');
    } finally {
      setSaving(false);
    }
  };

  const updateKegiatan = (index: number, value: string) => {
    setTemplates(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], kegiatan: value };
      return updated;
    });
  };

  const updatePekerjaan = (index: number, value: string) => {
    setTemplates(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], pekerjaan: value };
      return updated;
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
      >
        <FileText className="w-4 h-4" />
        <span>Atur Template Kalimat</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <span>Atur Template Kalimat Default</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih tema pekerjaan dari master data admin, lalu tulis kalimat rincian pekerjaan default Anda. Saat ambil data dari admin, kalimat ini akan otomatis terisi. Anda tetap bisa mengeditnya secara manual nanti.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Memuat template kalimat...
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((tpl, index) => (
                  <div
                    key={tpl.activity_type_key}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                  >
                    <div className="flex items-start space-x-2.5">
                      <BookOpen className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">
                          {tpl.masterLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Key: {tpl.activity_type_key}
                        </span>
                      </div>
                    </div>

                    <div className="ml-7 space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Judul Tema Kegiatan (Custom) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={tpl.kegiatan}
                          onChange={e => updateKegiatan(index, e.target.value)}
                          placeholder="Tulis judul tema kegiatan custom Anda..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Rincian Uraian Pekerjaan (Template) <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={tpl.pekerjaan}
                          onChange={e => updatePekerjaan(index, e.target.value)}
                          placeholder="Tulis kalimat default rincian pekerjaan Anda di sini..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none"
                        />
                      </div>
                      {tpl.pekerjaan.trim().length > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Template siap digunakan</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={fetchTemplates}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Template'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
