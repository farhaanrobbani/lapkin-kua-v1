import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, KuaDailyData, StaffActivity, PejabatPenilai, TelegramLog, UserActivityTemplate, UserActivityTemplatesMap } from '../../types/index.js';

interface DatabaseData {
  users: User[];
  kuaDailyData: KuaDailyData[];
  staffActivities: StaffActivity[];
  pejabatPenilai: PejabatPenilai;
  telegramLogs: TelegramLog[];
  userActivityTemplates: UserActivityTemplate[];
}

const DB_PATH = path.join(process.cwd(), '.data', 'database.json');

function ensureDataDirectory() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getInitialData(): DatabaseData {
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const stafPasswordHash = bcrypt.hashSync('staf123', 10);

  const adminUser: User = {
    id: 'usr-admin-001',
    email: 'admin@kua.go.id',
    role: 'admin',
    nama: 'H. Bambang Sugiarto, S.Ag',
    nip: '198005122008011012',
    jabatan: 'Pengelola Laporan KUA & Keuangan',
    level_jabatan: 'Pelaksana',
    pangkat: 'Penata Muda Tk. I',
    ruang_golongan: 'III/b',
    grade_tukin: 7,
    jumlah_tukin_kotor: 3915000,
    jumlah_tukin_bersih: 3719250,
    gapok: 3400000,
    foto_profil_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    tanda_tangan_url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=300',
    instansi: 'KUA Ampelgading',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const stafUser: User = {
    id: 'usr-staf-001',
    email: 'staf@kua.go.id',
    role: 'staf',
    nama: 'Ahmad Fauzi, S.HI',
    nip: '198808152014031002',
    jabatan: 'Penghulu Ahli Pertama',
    level_jabatan: 'Fungsional',
    pangkat: 'Penata Muda',
    ruang_golongan: 'III/a',
    grade_tukin: 8,
    jumlah_tukin_kotor: 4595000,
    jumlah_tukin_bersih: 4365250,
    gapok: 3600000,
    foto_profil_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    tanda_tangan_url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=300',
    instansi: 'KUA Ampelgading',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const pejabatPenilai: PejabatPenilai = {
    id: 'pjb-001',
    nama: 'Mohamad Amin, S.HI',
    nip: '197203102001121001',
    jabatan: 'Kepala KUA Ampelgading',
    stempel_url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Official_stamp_placeholder.png',
    tanda_tangan_url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=300',
    opsi_anchor_ttd: '^',
    updated_at: new Date().toISOString()
  };

  // Generate sample daily KUA data for July 2026
  const kuaDailyData: KuaDailyData[] = [];
  const staffActivities: StaffActivity[] = [];

  const year = 2026;
  const month = 7; // July

  for (let day = 1; day <= 28; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const tanggal = `${year}-07-${dayStr}`;

    // Skip weekends for realistic work days
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dailyLog: KuaDailyData = {
      id: `kua-daily-${day}`,
      tanggal,
      pendaftaran_nikah_kantor: (day % 3 === 0) ? 2 : 1,
      pendaftaran_nikah_luar_kantor: (day % 2 === 0) ? 3 : 1,
      pelaksanaan_nikah_kantor: (day % 4 === 0) ? 1 : 0,
      pelaksanaan_nikah_luar_kantor: (day % 5 === 0) ? 2 : 1,
      pelaksanaan_bimwin: (day % 7 === 0) ? 12 : 0,
      duplikat_buku_nikah: (day % 6 === 0) ? 1 : 0,
      surat_rekomendasi_nikah: (day % 2 === 0) ? 2 : 1,
      legalisir_buku_nikah: (day % 3 === 0) ? 4 : 2,
      surat_keluar: (day % 2 === 0) ? 3 : 1,
      pelaksanaan_wakaf: (day % 10 === 0) ? 1 : 0,
      created_by: adminUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    kuaDailyData.push(dailyLog);

    // Generate matching staff activity for Ahmad Fauzi (staf)
    staffActivities.push({
      id: `act-fauzi-${day}-1`,
      user_id: stafUser.id,
      tanggal,
      kegiatan: 'Pelaksanaan Pemeriksaan Calon Pengantin (Pemeriksaan Nikah)',
      pekerjaan: 'Memeriksa kelengkapan berkas pendaftaran nikah dan mewawancarai calon pengantin.',
      total_jumlah: dailyLog.pendaftaran_nikah_kantor + dailyLog.pendaftaran_nikah_luar_kantor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (dailyLog.pelaksanaan_nikah_luar_kantor > 0) {
      staffActivities.push({
        id: `act-fauzi-${day}-2`,
        user_id: stafUser.id,
        tanggal,
        kegiatan: 'Pelayanan dan Pengawasan Akad Nikah di Luar Kantor',
        pekerjaan: 'Menghadiri, memandu, dan memimpin akad nikah di lokasi bedol calon pengantin.',
        total_jumlah: dailyLog.pelaksanaan_nikah_luar_kantor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Generate staff activities for Admin (H. Bambang Sugiarto)
    staffActivities.push({
      id: `act-admin-${day}-1`,
      user_id: adminUser.id,
      tanggal,
      kegiatan: 'Pengelolaan, Pencatatan, dan Pengiriman Surat Keluar',
      pekerjaan: 'Pengelolaan, pencatatan agenda surat dinas KUA, dan verifikasi dokumen keuangan.',
      total_jumlah: dailyLog.surat_keluar || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (dailyLog.legalisir_buku_nikah > 0) {
      staffActivities.push({
        id: `act-admin-${day}-2`,
        user_id: adminUser.id,
        tanggal,
        kegiatan: 'Pelayanan Legalisir Buku Nikah',
        pekerjaan: 'Pemeriksaan keaslian dokumen buku nikah dan verifikasi register akta nikah.',
        total_jumlah: dailyLog.legalisir_buku_nikah,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }

  // Passwords mapped in memory
  (adminUser as any)._passwordHash = adminPasswordHash;
  (stafUser as any)._passwordHash = stafPasswordHash;

  return {
    users: [adminUser, stafUser],
    kuaDailyData,
    staffActivities,
    pejabatPenilai,
    telegramLogs: [],
    userActivityTemplates: []
  };
}

export class Database {
  private static instance: Database;
  private data: DatabaseData;

  private constructor() {
    ensureDataDirectory();
    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error loading DB file, reinitializing:', err);
        this.data = getInitialData();
        this.save();
      }
    } else {
      this.data = getInitialData();
      this.save();
    }
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public save() {
    try {
      ensureDataDirectory();
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  // Users CRUD
  public getUsers(): User[] {
    return this.data.users.map(({ ...u }) => {
      delete (u as any)._passwordHash;
      return u;
    });
  }

  public getUserById(id: string): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return undefined;
    const copy = { ...user };
    delete (copy as any)._passwordHash;
    return copy;
  }

  public getUserByEmail(email: string): (User & { _passwordHash?: string }) | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User, passwordRaw: string): User {
    const passwordHash = bcrypt.hashSync(passwordRaw, 10);
    const newUser = {
      ...user,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _passwordHash: passwordHash
    };
    this.data.users.push(newUser as any);
    this.save();

    const copy = { ...newUser };
    delete (copy as any)._passwordHash;
    return copy;
  }

  public updateUser(id: string, updates: Partial<User> & { password?: string }): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    const current = this.data.users[idx];
    let newHash = (current as any)._passwordHash;
    if (updates.password) {
      newHash = bcrypt.hashSync(updates.password, 10);
    }

    delete updates.password;

    const updatedUser = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
      _passwordHash: newHash
    };

    this.data.users[idx] = updatedUser;
    this.save();

    const copy = { ...updatedUser };
    delete (copy as any)._passwordHash;
    return copy;
  }

  public deleteUser(id: string): boolean {
    const initLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // KUA Daily Data CRUD
  public getKuaDailyData(month?: number, year?: number): KuaDailyData[] {
    let list = this.data.kuaDailyData;
    if (year && month) {
      list = list.filter(item => {
        const [y, m] = item.tanggal.split('-').map(Number);
        return y === year && m === month;
      });
    }
    return list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }

  public getKuaDailyByDate(tanggal: string): KuaDailyData | undefined {
    return this.data.kuaDailyData.find(item => item.tanggal === tanggal);
  }

  public upsertKuaDailyData(data: Omit<KuaDailyData, 'id' | 'created_at' | 'updated_at'> & { id?: string }): KuaDailyData {
    const existingIdx = this.data.kuaDailyData.findIndex(item => item.tanggal === data.tanggal);
    const now = new Date().toISOString();

    if (existingIdx !== -1) {
      const updated = {
        ...this.data.kuaDailyData[existingIdx],
        ...data,
        updated_at: now
      };
      this.data.kuaDailyData[existingIdx] = updated;
      this.save();
      return updated;
    } else {
      const created: KuaDailyData = {
        id: data.id || `kua-daily-${Date.now()}`,
        tanggal: data.tanggal || new Date().toISOString().split('T')[0],
        pendaftaran_nikah_kantor: data.pendaftaran_nikah_kantor || 0,
        pendaftaran_nikah_luar_kantor: data.pendaftaran_nikah_luar_kantor || 0,
        pelaksanaan_nikah_kantor: data.pelaksanaan_nikah_kantor || 0,
        pelaksanaan_nikah_luar_kantor: data.pelaksanaan_nikah_luar_kantor || 0,
        pelaksanaan_bimwin: data.pelaksanaan_bimwin || 0,
        duplikat_buku_nikah: data.duplikat_buku_nikah || 0,
        surat_rekomendasi_nikah: data.surat_rekomendasi_nikah || 0,
        legalisir_buku_nikah: data.legalisir_buku_nikah || 0,
        surat_keluar: data.surat_keluar || 0,
        pelaksanaan_wakaf: data.pelaksanaan_wakaf || 0,
        ...data,
        created_at: now,
        updated_at: now
      };
      this.data.kuaDailyData.push(created);
      this.save();
      return created;
    }
  }

  public deleteKuaDailyData(id: string): boolean {
    const initLen = this.data.kuaDailyData.length;
    this.data.kuaDailyData = this.data.kuaDailyData.filter(item => item.id !== id);
    if (this.data.kuaDailyData.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Staff Activities CRUD
  public getStaffActivities(userId?: string, month?: number, year?: number): StaffActivity[] {
    let list = this.data.staffActivities;
    if (userId) {
      list = list.filter(item => item.user_id === userId);
    }
    if (year && month) {
      list = list.filter(item => {
        const [y, m] = item.tanggal.split('-').map(Number);
        return y === year && m === month;
      });
    }
    return list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }

  public createStaffActivity(activity: Omit<StaffActivity, 'id' | 'created_at' | 'updated_at'>): StaffActivity {
    const now = new Date().toISOString();
    const newActivity: StaffActivity = {
      ...activity,
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: now,
      updated_at: now
    };
    this.data.staffActivities.push(newActivity);
    this.save();
    return newActivity;
  }

  public updateStaffActivity(id: string, updates: Partial<StaffActivity>): StaffActivity | null {
    const idx = this.data.staffActivities.findIndex(item => item.id === id);
    if (idx === -1) return null;
    const updated = {
      ...this.data.staffActivities[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.data.staffActivities[idx] = updated;
    this.save();
    return updated;
  }

  public deleteStaffActivity(id: string): boolean {
    const initLen = this.data.staffActivities.length;
    this.data.staffActivities = this.data.staffActivities.filter(item => item.id !== id);
    if (this.data.staffActivities.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Pejabat Penilai Settings
  public getPejabatPenilai(): PejabatPenilai {
    return this.data.pejabatPenilai;
  }

  public updatePejabatPenilai(updates: Partial<PejabatPenilai>): PejabatPenilai {
    this.data.pejabatPenilai = {
      ...this.data.pejabatPenilai,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data.pejabatPenilai;
  }

  // Telegram Logs
  public getTelegramLogs(): TelegramLog[] {
    return this.data.telegramLogs || [];
  }

  public addTelegramLog(log: Omit<TelegramLog, 'id' | 'timestamp'>): TelegramLog {
    if (!this.data.telegramLogs) this.data.telegramLogs = [];
    const newLog: TelegramLog = {
      ...log,
      id: `tg-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    this.data.telegramLogs.unshift(newLog);
    if (this.data.telegramLogs.length > 100) {
      this.data.telegramLogs = this.data.telegramLogs.slice(0, 100);
    }
    this.save();
    return newLog;
  }

  // User Activity Templates
  public getUserActivityTemplates(userId: string): UserActivityTemplate[] {
    if (!this.data.userActivityTemplates) this.data.userActivityTemplates = [];
    return this.data.userActivityTemplates.filter(t => t.user_id === userId);
  }

  public getUserActivityTemplatesMap(userId: string): UserActivityTemplatesMap {
    const templates = this.getUserActivityTemplates(userId);
    const map: UserActivityTemplatesMap = {};
    templates.forEach(t => {
      map[t.activity_type_key] = { kegiatan: t.kegiatan, pekerjaan: t.pekerjaan };
    });
    return map;
  }

  public upsertUserActivityTemplate(
    userId: string,
    activityTypeKey: string,
    data: { kegiatan: string; pekerjaan: string }
  ): UserActivityTemplate {
    if (!this.data.userActivityTemplates) this.data.userActivityTemplates = [];
    const idx = this.data.userActivityTemplates.findIndex(
      t => t.user_id === userId && t.activity_type_key === activityTypeKey
    );
    const now = new Date().toISOString();

    if (idx !== -1) {
      this.data.userActivityTemplates[idx] = {
        ...this.data.userActivityTemplates[idx],
        kegiatan: data.kegiatan,
        pekerjaan: data.pekerjaan,
        updated_at: now
      };
      this.save();
      return this.data.userActivityTemplates[idx];
    } else {
      const template: UserActivityTemplate = {
        id: `ut-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        user_id: userId,
        activity_type_key: activityTypeKey,
        kegiatan: data.kegiatan,
        pekerjaan: data.pekerjaan,
        created_at: now,
        updated_at: now
      };
      this.data.userActivityTemplates.push(template);
      this.save();
      return template;
    }
  }

  public bulkUpsertUserActivityTemplates(
    userId: string,
    templates: Array<{ activity_type_key: string; kegiatan: string; pekerjaan: string }>
  ): UserActivityTemplate[] {
    return templates.map(t => this.upsertUserActivityTemplate(userId, t.activity_type_key, {
      kegiatan: t.kegiatan,
      pekerjaan: t.pekerjaan
    }));
  }

  public deleteUserActivityTemplate(userId: string, activityTypeKey: string): boolean {
    if (!this.data.userActivityTemplates) return false;
    const initLen = this.data.userActivityTemplates.length;
    this.data.userActivityTemplates = this.data.userActivityTemplates.filter(
      t => !(t.user_id === userId && t.activity_type_key === activityTypeKey)
    );
    if (this.data.userActivityTemplates.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }
}

export const db = Database.getInstance();
