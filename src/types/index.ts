export type UserRole = 'admin' | 'staf';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  nama: string;
  nip: string;
  jabatan: string;
  level_jabatan: string;
  pangkat: string;
  ruang_golongan: string;
  grade_tukin: number;
  jumlah_tukin_kotor: number;
  jumlah_tukin_bersih: number;
  gapok: number;
  jumlah_uang_makan_harian: number;
  foto_profil_url: string;
  tanda_tangan_url?: string;
  instansi: string;
  created_at?: string;
  updated_at?: string;
}

export interface KuaDailyData {
  id: string;
  tanggal: string; // YYYY-MM-DD
  pendaftaran_nikah_kantor?: number;
  pendaftaran_nikah_luar_kantor?: number;
  pelaksanaan_nikah_kantor?: number;
  pelaksanaan_nikah_luar_kantor?: number;
  pelaksanaan_bimwin?: number;
  duplikat_buku_nikah?: number;
  surat_rekomendasi_nikah?: number;
  legalisir_buku_nikah?: number;
  surat_keluar?: number;
  pelaksanaan_wakaf?: number;
  [key: string]: any;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffActivity {
  id: string;
  user_id: string;
  tanggal: string; // YYYY-MM-DD
  kegiatan: string;
  pekerjaan: string;
  activity_type_key?: string; // key matching KuaDailyData field for auto calculation
  total_jumlah: number;
  created_at: string;
  updated_at: string;
}

export interface PejabatPenilai {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  stempel_url: string;
  tanda_tangan_url: string;
  opsi_anchor_ttd?: string;
  updated_at: string;
}

export interface UserActivityTemplate {
  id: string;
  user_id: string;
  activity_type_key: string;
  kegiatan: string;
  pekerjaan: string;
  created_at: string;
  updated_at: string;
}

export type UserActivityTemplatesMap = Record<string, { kegiatan: string; pekerjaan: string }>;

export interface TelegramLog {
  id: string;
  command: string;
  chat_id: string;
  user_name: string;
  message: string;
  status: 'sent' | 'received' | 'failed';
  timestamp: string;
}

export interface MonthlySummaryReport {
  user: User;
  month: number;
  year: number;
  monthName: string;
  pejabatPenilai: PejabatPenilai;
  totalHariKerja: number;
  totalKegiatan: number;
  totalPekerjaan: number;
  totalVolume: number;
  rekapTukinKotor: number;
  rekapTukinBersih: number;
  rekapUangMakan: number;
  activitiesByDate: { [tanggal: string]: StaffActivity[] };
}

export const KUA_ACTIVITY_MAPPING: { [key: string]: { label: string; field: keyof Omit<KuaDailyData, 'id' | 'tanggal' | 'created_by' | 'created_at' | 'updated_at'> } } = {
  'pendaftaran_nikah_kantor': { label: 'Pendaftaran Nikah di Kantor', field: 'pendaftaran_nikah_kantor' },
  'pendaftaran_nikah_luar_kantor': { label: 'Pendaftaran Nikah di Luar Kantor', field: 'pendaftaran_nikah_luar_kantor' },
  'pelaksanaan_nikah_kantor': { label: 'Pelaksanaan Nikah di Kantor', field: 'pelaksanaan_nikah_kantor' },
  'pelaksanaan_nikah_luar_kantor': { label: 'Pelaksanaan Nikah di Luar Kantor', field: 'pelaksanaan_nikah_luar_kantor' },
  'pelaksanaan_bimwin': { label: 'Pelaksanaan Bimbingan Perkawinan (Bimwin)', field: 'pelaksanaan_bimwin' },
  'duplikat_buku_nikah': { label: 'Pelayanan Duplikat Buku Nikah', field: 'duplikat_buku_nikah' },
  'surat_rekomendasi_nikah': { label: 'Penerbitan Surat Rekomendasi Nikah', field: 'surat_rekomendasi_nikah' },
  'legalisir_buku_nikah': { label: 'Pelayanan Legalisir Buku Nikah', field: 'legalisir_buku_nikah' },
  'surat_keluar': { label: 'Pengelolaan & Pengiriman Surat Keluar', field: 'surat_keluar' },
  'pelaksanaan_wakaf': { label: 'Pelaksanaan & Pelayanan Akta Wakaf', field: 'pelaksanaan_wakaf' },
};
