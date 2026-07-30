import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types/index';
import { formatRupiah } from '../../utils/formatters';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Save,
  Shield,
  User as UserIcon
} from 'lucide-react';

interface Props {
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const UserManagement: React.FC<Props> = ({ showToast }) => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> & { password?: string } | null>(null);
  const [defaultInstansi, setDefaultInstansi] = useState('KUA Ampelgading');

  useEffect(() => {
    if (token) {
      fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.settings?.kua_instansi) setDefaultInstansi(d.settings.kua_instansi); })
        .catch(() => {});
    }
  }, [token]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
      }
    } catch {
      showToast('error', 'Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const handleOpenAddModal = () => {
    setEditingUser({
      role: 'staf',
      nama: '',
      email: '',
      password: '',
      nip: '',
      jabatan: 'Penghulu Ahli Pertama',
      level_jabatan: 'Fungsional',
      pangkat: 'Penata Muda',
      ruang_golongan: 'III/a',
      grade_tukin: 8,
      jumlah_tukin_kotor: 4595000,
      jumlah_tukin_bersih: 4365250,
      gapok: 3600000,
      instansi: defaultInstansi,
      foto_profil_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      tanda_tangan_url: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser({ ...user, password: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.nama || !editingUser.email || !editingUser.nip) {
      showToast('error', 'Nama, Email, dan NIP wajib diisi.');
      return;
    }

    const isEdit = !!editingUser.id;
    const url = isEdit ? `/api/users/${editingUser.id}` : '/api/users';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingUser)
      });

      if (res.ok) {
        showToast('success', `Pengguna berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}.`);
        setIsModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const json = await res.json();
        showToast('error', json.error || 'Gagal menyimpan data pengguna.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan koneksi.');
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      showToast('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('success', 'Pengguna berhasil dihapus.');
        setDeleteConfirmId(null);
        fetchUsers();
      } else {
        showToast('error', 'Gagal menghapus pengguna.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan koneksi.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-500" />
            <span>Kelola Akun Pegawai / Staf (Admin)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Atur akun pengguna, NIP, Jabatan, Pangkat, Grade Tukin, Tukin Kotor/Bersih, dan Tanda Tangan Digital.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Pegawai</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-3">Pegawai</th>
                <th className="p-3">NIP & Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Jabatan & Golongan</th>
                <th className="p-3">Grade & Tukin Kotor</th>
                <th className="p-3">Tukin Bersih</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Memuat data akun pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Belum ada akun pengguna terdaftar.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={u.foto_profil_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={u.nama}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{u.nama}</p>
                          <p className="text-[11px] text-slate-400">{u.instansi}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <p className="font-mono text-slate-800 dark:text-slate-200">{u.nip}</p>
                      <p className="text-[11px] text-slate-500">{u.email}</p>
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.role === 'admin'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                        <span className="capitalize">{u.role}</span>
                      </span>
                    </td>

                    <td className="p-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{u.jabatan}</p>
                      <p className="text-[11px] text-slate-400">{u.pangkat} ({u.ruang_golongan})</p>
                    </td>

                    <td className="p-3">
                      <p className="font-bold text-slate-900 dark:text-white">Grade {u.grade_tukin}</p>
                      <p className="text-[11px] text-slate-500">{formatRupiah(u.jumlah_tukin_kotor)}</p>
                    </td>

                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(u.jumlah_tukin_bersih)}
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg mr-1"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirmId === u.id ? (
                        <div className="inline-flex items-center space-x-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-300 dark:border-rose-800">
                          <button
                            onClick={() => handleDelete(u.id)}
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
                          onClick={() => setDeleteConfirmId(u.id)}
                          disabled={u.id === currentUser?.id}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg disabled:opacity-30"
                          title="Hapus User"
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

      {/* Modal Form */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingUser.id ? 'Edit Akun Pegawai' : 'Tambah Akun Pegawai Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    value={editingUser.nama || ''}
                    onChange={e => setEditingUser({ ...editingUser, nama: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIP *
                  </label>
                  <input
                    type="text"
                    value={editingUser.nip || ''}
                    onChange={e => setEditingUser({ ...editingUser, nip: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Pengguna *
                  </label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kata Sandi {editingUser.id ? '(Opsional / Kosongkan jika tidak diubah)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={editingUser.password || ''}
                    onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                    placeholder={editingUser.id ? '••••••••' : 'Password baru'}
                    required={!editingUser.id}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role Sistem
                  </label>
                  <select
                    value={editingUser.role || 'staf'}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none cursor-pointer"
                  >
                    <option value="staf">Staf / Pegawai KUA</option>
                    <option value="admin">Admin / Pengelola Laporan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    value={editingUser.jabatan || ''}
                    onChange={e => setEditingUser({ ...editingUser, jabatan: e.target.value })}
                    placeholder="Penghulu Ahli Pertama"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pangkat & Ruang Golongan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editingUser.pangkat || ''}
                      onChange={e => setEditingUser({ ...editingUser, pangkat: e.target.value })}
                      placeholder="Penata Muda"
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                    />
                    <input
                      type="text"
                      value={editingUser.ruang_golongan || ''}
                      onChange={e => setEditingUser({ ...editingUser, ruang_golongan: e.target.value })}
                      placeholder="III/a"
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Grade Tukin & Gapok (Rp)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={editingUser.grade_tukin ?? 8}
                      onChange={e => setEditingUser({ ...editingUser, grade_tukin: Number(e.target.value) })}
                      placeholder="8"
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                    />
                    <input
                      type="number"
                      value={editingUser.gapok ?? 3600000}
                      onChange={e => setEditingUser({ ...editingUser, gapok: Number(e.target.value) })}
                      placeholder="3600000"
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Tukin Kotor (Rp)
                  </label>
                  <input
                    type="number"
                    value={editingUser.jumlah_tukin_kotor ?? 4595000}
                    onChange={e => setEditingUser({ ...editingUser, jumlah_tukin_kotor: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Tukin Bersih (Rp)
                  </label>
                  <input
                    type="number"
                    value={editingUser.jumlah_tukin_bersih ?? 4365250}
                    onChange={e => setEditingUser({ ...editingUser, jumlah_tukin_bersih: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    URL Foto Profil
                  </label>
                  <input
                    type="text"
                    value={editingUser.foto_profil_url || ''}
                    onChange={e => setEditingUser({ ...editingUser, foto_profil_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>


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
                  <span>Simpan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
