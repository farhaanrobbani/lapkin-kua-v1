import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, KuaDailyData, StaffActivity, PejabatPenilai, TelegramLog, UserActivityTemplate, UserActivityTemplatesMap } from '../../types/index.js';
import { query, isConnected, initializeSchema, seedInitialData } from './postgres.js';

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
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getInitialData(): DatabaseData {
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const stafPasswordHash = bcrypt.hashSync('staf123', 10);

  const adminUser: User = { id: 'usr-admin-001', email: 'admin@kua.go.id', role: 'admin', nama: 'H. Bambang Sugiarto, S.Ag', nip: '198005122008011012', jabatan: 'Pengelola Laporan KUA & Keuangan', level_jabatan: 'Pelaksana', pangkat: 'Penata Muda Tk. I', ruang_golongan: 'III/b', grade_tukin: 7, jumlah_tukin_kotor: 3915000, jumlah_tukin_bersih: 3719250, gapok: 3400000, foto_profil_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', tanda_tangan_url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=300', instansi: 'KUA Ampelgading', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const stafUser: User = { id: 'usr-staf-001', email: 'staf@kua.go.id', role: 'staf', nama: 'Ahmad Fauzi, S.HI', nip: '198808152014031002', jabatan: 'Penghulu Ahli Pertama', level_jabatan: 'Fungsional', pangkat: 'Penata Muda', ruang_golongan: 'III/a', grade_tukin: 8, jumlah_tukin_kotor: 4595000, jumlah_tukin_bersih: 4365250, gapok: 3600000, foto_profil_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', tanda_tangan_url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=300', instansi: 'KUA Ampelgading', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const pejabatPenilai: PejabatPenilai = { id: 'pjb-001', nama: 'Mohamad Amin, S.HI', nip: '197203102001121001', jabatan: 'Kepala KUA Ampelgading', stempel_url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Official_stamp_placeholder.png', tanda_tangan_url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=300', opsi_anchor_ttd: '^', updated_at: new Date().toISOString() };

  const kuaDailyData: KuaDailyData[] = [];
  const staffActivities: StaffActivity[] = [];
  for (let day = 1; day <= 28; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const tanggal = `2026-07-${dayStr}`;
    const dateObj = new Date(2026, 6, day);
    if (dateObj.getDay() === 0 || dateObj.getDay() === 6) continue;
    const d: KuaDailyData = { id: `kua-daily-${day}`, tanggal, pendaftaran_nikah_kantor: (day % 3 === 0) ? 2 : 1, pendaftaran_nikah_luar_kantor: (day % 2 === 0) ? 3 : 1, pelaksanaan_nikah_kantor: (day % 4 === 0) ? 1 : 0, pelaksanaan_nikah_luar_kantor: (day % 5 === 0) ? 2 : 1, pelaksanaan_bimwin: (day % 7 === 0) ? 12 : 0, duplikat_buku_nikah: (day % 6 === 0) ? 1 : 0, surat_rekomendasi_nikah: (day % 2 === 0) ? 2 : 1, legalisir_buku_nikah: (day % 3 === 0) ? 4 : 2, surat_keluar: (day % 2 === 0) ? 3 : 1, pelaksanaan_wakaf: (day % 10 === 0) ? 1 : 0, created_by: adminUser.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    kuaDailyData.push(d);
    staffActivities.push({ id: `act-fauzi-${day}-1`, user_id: stafUser.id, tanggal, kegiatan: 'Pelaksanaan Pemeriksaan Calon Pengantin (Pemeriksaan Nikah)', pekerjaan: 'Memeriksa kelengkapan berkas pendaftaran nikah dan mewawancarai calon pengantin.', total_jumlah: d.pendaftaran_nikah_kantor! + d.pendaftaran_nikah_luar_kantor!, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    if (d.pelaksanaan_nikah_luar_kantor! > 0) staffActivities.push({ id: `act-fauzi-${day}-2`, user_id: stafUser.id, tanggal, kegiatan: 'Pelayanan dan Pengawasan Akad Nikah di Luar Kantor', pekerjaan: 'Menghadiri, memandu, dan memimpin akad nikah di lokasi bedol calon pengantin.', total_jumlah: d.pelaksanaan_nikah_luar_kantor!, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    staffActivities.push({ id: `act-admin-${day}-1`, user_id: adminUser.id, tanggal, kegiatan: 'Pengelolaan, Pencatatan, dan Pengiriman Surat Keluar', pekerjaan: 'Pengelolaan, pencatatan agenda surat dinas KUA, dan verifikasi dokumen keuangan.', total_jumlah: d.surat_keluar || 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    if (d.legalisir_buku_nikah! > 0) staffActivities.push({ id: `act-admin-${day}-2`, user_id: adminUser.id, tanggal, kegiatan: 'Pelayanan Legalisir Buku Nikah', pekerjaan: 'Pemeriksaan keaslian dokumen buku nikah dan verifikasi register akta nikah.', total_jumlah: d.legalisir_buku_nikah!, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }

  (adminUser as any)._passwordHash = adminPasswordHash;
  (stafUser as any)._passwordHash = stafPasswordHash;

  return { users: [adminUser, stafUser], kuaDailyData, staffActivities, pejabatPenilai, telegramLogs: [], userActivityTemplates: [] };
}

function parseUserRow(row: any): User {
  const u = { ...row };
  delete u.password;
  return u as User;
}

export class Database {
  private static instance: Database;
  private pgAvailable = false;
  private jsonData: DatabaseData;

  private constructor() {
    this.jsonData = getInitialData();
  }

  public static getInstance(): Database {
    if (!Database.instance) Database.instance = new Database();
    return Database.instance;
  }

  async init() {
    this.pgAvailable = await isConnected();
    if (this.pgAvailable) {
      await initializeSchema();
      await seedInitialData();
    } else {
      ensureDataDirectory();
      if (fs.existsSync(DB_PATH)) {
        try { this.jsonData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); }
        catch { this.jsonData = getInitialData(); this.jsonSave(); }
      } else { this.jsonSave(); }
    }
  }

  private jsonSave() {
    try { ensureDataDirectory(); fs.writeFileSync(DB_PATH, JSON.stringify(this.jsonData, null, 2), 'utf-8'); }
    catch (err) { console.error('Failed to save database file:', err); }
  }

  async getUsers(): Promise<User[]> {
    if (this.pgAvailable) {
      const result = await query('SELECT id, email, role, nama, nip, jabatan, level_jabatan, pangkat, ruang_golongan, grade_tukin, jumlah_tukin_kotor, jumlah_tukin_bersih, gapok, foto_profil_url, tanda_tangan_url, instansi, created_at, updated_at FROM users ORDER BY nama');
      return result.rows.map(parseUserRow);
    }
    return this.jsonData.users.map(({ ...u }) => { delete (u as any)._passwordHash; return u; });
  }

  async getUserById(id: string): Promise<User | undefined> {
    if (this.pgAvailable) {
      const result = await query('SELECT id, email, role, nama, nip, jabatan, level_jabatan, pangkat, ruang_golongan, grade_tukin, jumlah_tukin_kotor, jumlah_tukin_bersih, gapok, foto_profil_url, tanda_tangan_url, instansi, created_at, updated_at FROM users WHERE id = $1', [id]);
      return result.rows.length ? parseUserRow(result.rows[0]) : undefined;
    }
    const user = this.jsonData.users.find(u => u.id === id);
    if (!user) return undefined;
    const copy = { ...user };
    delete (copy as any)._passwordHash;
    return copy;
  }

  async getUserByEmail(email: string): Promise<(User & { _passwordHash?: string }) | undefined> {
    if (this.pgAvailable) {
      const result = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      if (!result.rows.length) return undefined;
      const row = result.rows[0];
      return { ...parseUserRow(row), _passwordHash: row.password };
    }
    return this.jsonData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async createUser(user: User, passwordRaw: string): Promise<User> {
    if (this.pgAvailable) {
      const passwordHash = bcrypt.hashSync(passwordRaw, 10);
      const result = await query(`
        INSERT INTO users (email, password, role, nama, nip, jabatan, level_jabatan, pangkat, ruang_golongan, grade_tukin, jumlah_tukin_kotor, jumlah_tukin_bersih, gapok, foto_profil_url, tanda_tangan_url, instansi)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING id, email, role, nama, nip, jabatan, level_jabatan, pangkat, ruang_golongan, grade_tukin, jumlah_tukin_kotor, jumlah_tukin_bersih, gapok, foto_profil_url, tanda_tangan_url, instansi, created_at, updated_at
      `, [user.email, passwordHash, user.role, user.nama, user.nip, user.jabatan, user.level_jabatan, user.pangkat, user.ruang_golongan, user.grade_tukin, user.jumlah_tukin_kotor, user.jumlah_tukin_bersih, user.gapok, user.foto_profil_url, user.tanda_tangan_url, user.instansi]);
      return parseUserRow(result.rows[0]);
    }
    const passwordHash = bcrypt.hashSync(passwordRaw, 10);
    const newUser = { ...user, id: `usr-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), _passwordHash: passwordHash };
    this.jsonData.users.push(newUser as any);
    this.jsonSave();
    const copy = { ...newUser };
    delete (copy as any)._passwordHash;
    return copy;
  }

  async updateUser(id: string, updates: Partial<User> & { password?: string }): Promise<User | null> {
    if (this.pgAvailable) {
      const fields: string[] = []; const values: any[] = []; let idx = 1;
      const allowed = ['email','role','nama','nip','jabatan','level_jabatan','pangkat','ruang_golongan','grade_tukin','jumlah_tukin_kotor','jumlah_tukin_bersih','gapok','foto_profil_url','tanda_tangan_url','instansi'];
      for (const key of allowed) {
        if ((updates as any)[key] !== undefined) {
          fields.push(`${key} = $${idx++}`);
          values.push((updates as any)[key]);
        }
      }
      if (updates.password) {
        fields.push(`password = $${idx++}`);
        values.push(bcrypt.hashSync(updates.password, 10));
      }
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      if (fields.length === 1) return null;
      values.push(id);
      const result = await query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, role, nama, nip, jabatan, level_jabatan, pangkat, ruang_golongan, grade_tukin, jumlah_tukin_kotor, jumlah_tukin_bersih, gapok, foto_profil_url, tanda_tangan_url, instansi, created_at, updated_at`, values);
      return result.rows.length ? parseUserRow(result.rows[0]) : null;
    }
    const idx = this.jsonData.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    const current = this.jsonData.users[idx];
    let newHash = (current as any)._passwordHash;
    if (updates.password) newHash = bcrypt.hashSync(updates.password, 10);
    delete updates.password;
    const updatedUser = { ...current, ...updates, updated_at: new Date().toISOString(), _passwordHash: newHash };
    this.jsonData.users[idx] = updatedUser;
    this.jsonSave();
    const copy = { ...updatedUser };
    delete (copy as any)._passwordHash;
    return copy;
  }

  async deleteUser(id: string): Promise<boolean> {
    if (this.pgAvailable) {
      const result = await query('DELETE FROM users WHERE id = $1', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    }
    const initLen = this.jsonData.users.length;
    this.jsonData.users = this.jsonData.users.filter(u => u.id !== id);
    if (this.jsonData.users.length !== initLen) { this.jsonSave(); return true; }
    return false;
  }

  async getKuaDailyData(month?: number, year?: number): Promise<KuaDailyData[]> {
    if (this.pgAvailable) {
      let sql = 'SELECT * FROM kua_daily_data'; const params: any[] = [];
      if (year && month) { sql += ' WHERE EXTRACT(YEAR FROM tanggal) = $1 AND EXTRACT(MONTH FROM tanggal) = $2'; params.push(year, month); }
      sql += ' ORDER BY tanggal';
      const result = await query(sql, params);
      return result.rows.map((r: any) => ({ ...r, tanggal: r.tanggal.toISOString().split('T')[0] }));
    }
    let list = this.jsonData.kuaDailyData;
    if (year && month) list = list.filter(item => { const [y, m] = item.tanggal.split('-').map(Number); return y === year && m === month; });
    return list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }

  async getKuaDailyByDate(tanggal: string): Promise<KuaDailyData | undefined> {
    if (this.pgAvailable) {
      const result = await query('SELECT * FROM kua_daily_data WHERE tanggal = $1', [tanggal]);
      if (!result.rows.length) return undefined;
      const r = result.rows[0];
      return { ...r, tanggal: r.tanggal.toISOString().split('T')[0] };
    }
    return this.jsonData.kuaDailyData.find(item => item.tanggal === tanggal);
  }

  async upsertKuaDailyData(data: Omit<KuaDailyData, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<KuaDailyData> {
    if (this.pgAvailable) {
      const existing = await query('SELECT id FROM kua_daily_data WHERE tanggal = $1', [data.tanggal]);
      if (existing.rows.length) {
        const allowed = ['pendaftaran_nikah_kantor','pendaftaran_nikah_luar_kantor','pelaksanaan_nikah_kantor','pelaksanaan_nikah_luar_kantor','pelaksanaan_bimwin','duplikat_buku_nikah','surat_rekomendasi_nikah','legalisir_buku_nikah','surat_keluar','pelaksanaan_wakaf','created_by'];
        const sets: string[] = []; const vals: any[] = []; let idx = 1;
        for (const k of allowed) { if ((data as any)[k] !== undefined) { sets.push(`${k} = $${idx++}`); vals.push((data as any)[k]); } }
        sets.push('updated_at = CURRENT_TIMESTAMP');
        vals.push(existing.rows[0].id);
        await query(`UPDATE kua_daily_data SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
        const updated = await query('SELECT * FROM kua_daily_data WHERE id = $1', [existing.rows[0].id]);
        const r = updated.rows[0];
        return { ...r, tanggal: r.tanggal.toISOString().split('T')[0] };
      } else {
        const result = await query(`
          INSERT INTO kua_daily_data (tanggal, pendaftaran_nikah_kantor, pendaftaran_nikah_luar_kantor, pelaksanaan_nikah_kantor, pelaksanaan_nikah_luar_kantor, pelaksanaan_bimwin, duplikat_buku_nikah, surat_rekomendasi_nikah, legalisir_buku_nikah, surat_keluar, pelaksanaan_wakaf, created_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          RETURNING *
        `, [data.tanggal, data.pendaftaran_nikah_kantor || 0, data.pendaftaran_nikah_luar_kantor || 0, data.pelaksanaan_nikah_kantor || 0, data.pelaksanaan_nikah_luar_kantor || 0, data.pelaksanaan_bimwin || 0, data.duplikat_buku_nikah || 0, data.surat_rekomendasi_nikah || 0, data.legalisir_buku_nikah || 0, data.surat_keluar || 0, data.pelaksanaan_wakaf || 0, data.created_by || null]);
        const r = result.rows[0];
        return { ...r, tanggal: r.tanggal.toISOString().split('T')[0] };
      }
    }
    const existingIdx = this.jsonData.kuaDailyData.findIndex(item => item.tanggal === data.tanggal);
    const now = new Date().toISOString();
    if (existingIdx !== -1) {
      const updated = { ...this.jsonData.kuaDailyData[existingIdx], ...data, updated_at: now };
      this.jsonData.kuaDailyData[existingIdx] = updated; this.jsonSave(); return updated;
    } else {
      const created: KuaDailyData = { id: data.id || `kua-daily-${Date.now()}`, tanggal: data.tanggal || new Date().toISOString().split('T')[0], pendaftaran_nikah_kantor: data.pendaftaran_nikah_kantor || 0, pendaftaran_nikah_luar_kantor: data.pendaftaran_nikah_luar_kantor || 0, pelaksanaan_nikah_kantor: data.pelaksanaan_nikah_kantor || 0, pelaksanaan_nikah_luar_kantor: data.pelaksanaan_nikah_luar_kantor || 0, pelaksanaan_bimwin: data.pelaksanaan_bimwin || 0, duplikat_buku_nikah: data.duplikat_buku_nikah || 0, surat_rekomendasi_nikah: data.surat_rekomendasi_nikah || 0, legalisir_buku_nikah: data.legalisir_buku_nikah || 0, surat_keluar: data.surat_keluar || 0, pelaksanaan_wakaf: data.pelaksanaan_wakaf || 0, ...data, created_at: now, updated_at: now };
      this.jsonData.kuaDailyData.push(created); this.jsonSave(); return created;
    }
  }

  async deleteKuaDailyData(id: string): Promise<boolean> {
    if (this.pgAvailable) {
      const result = await query('DELETE FROM kua_daily_data WHERE id = $1', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    }
    const initLen = this.jsonData.kuaDailyData.length;
    this.jsonData.kuaDailyData = this.jsonData.kuaDailyData.filter(item => item.id !== id);
    if (this.jsonData.kuaDailyData.length !== initLen) { this.jsonSave(); return true; }
    return false;
  }

  async getStaffActivities(userId?: string, month?: number, year?: number): Promise<StaffActivity[]> {
    if (this.pgAvailable) {
      let sql = 'SELECT * FROM staff_activities WHERE 1=1'; const params: any[] = [];
      if (userId) { sql += ' AND user_id = $' + (params.length + 1); params.push(userId); }
      if (year && month) { sql += ' AND EXTRACT(YEAR FROM tanggal) = $' + (params.length + 1) + ' AND EXTRACT(MONTH FROM tanggal) = $' + (params.length + 2); params.push(year, month); }
      sql += ' ORDER BY tanggal';
      const result = await query(sql, params);
      return result.rows.map((r: any) => ({ ...r, tanggal: r.tanggal.toISOString().split('T')[0] }));
    }
    let list = this.jsonData.staffActivities;
    if (userId) list = list.filter(item => item.user_id === userId);
    if (year && month) list = list.filter(item => { const [y, m] = item.tanggal.split('-').map(Number); return y === year && m === month; });
    return list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }

  async createStaffActivity(activity: Omit<StaffActivity, 'id' | 'created_at' | 'updated_at'>): Promise<StaffActivity> {
    if (this.pgAvailable) {
      const result = await query(`
        INSERT INTO staff_activities (user_id, tanggal, kegiatan, pekerjaan, activity_type_key, total_jumlah)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *
      `, [activity.user_id, activity.tanggal, activity.kegiatan, activity.pekerjaan, activity.activity_type_key || null, activity.total_jumlah || 1]);
      const r = result.rows[0];
      return { ...r, tanggal: r.tanggal.toISOString().split('T')[0] };
    }
    const now = new Date().toISOString();
    const newActivity: StaffActivity = { ...activity, id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`, created_at: now, updated_at: now };
    this.jsonData.staffActivities.push(newActivity); this.jsonSave();
    return newActivity;
  }

  async updateStaffActivity(id: string, updates: Partial<StaffActivity>): Promise<StaffActivity | null> {
    if (this.pgAvailable) {
      const fields: string[] = []; const vals: any[] = []; let idx = 1;
      const allowedUpdates = ['user_id','tanggal','kegiatan','pekerjaan','activity_type_key','total_jumlah'];
      for (const k of allowedUpdates) {
        if ((updates as any)[k] !== undefined) {
          fields.push(`${k} = $${idx++}`);
          vals.push((updates as any)[k]);
        }
      }
      fields.push('updated_at = CURRENT_TIMESTAMP');
      vals.push(id);
      if (fields.length === 1) return null;
      const result = await query(`UPDATE staff_activities SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
      if (!result.rows.length) return null;
      const r = result.rows[0];
      return { ...r, tanggal: r.tanggal.toISOString().split('T')[0] };
    }
    const idx = this.jsonData.staffActivities.findIndex(item => item.id === id);
    if (idx === -1) return null;
    const updated = { ...this.jsonData.staffActivities[idx], ...updates, updated_at: new Date().toISOString() };
    this.jsonData.staffActivities[idx] = updated; this.jsonSave();
    return updated;
  }

  async deleteStaffActivity(id: string): Promise<boolean> {
    if (this.pgAvailable) {
      const result = await query('DELETE FROM staff_activities WHERE id = $1', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    }
    const initLen = this.jsonData.staffActivities.length;
    this.jsonData.staffActivities = this.jsonData.staffActivities.filter(item => item.id !== id);
    if (this.jsonData.staffActivities.length !== initLen) { this.jsonSave(); return true; }
    return false;
  }

  async getPejabatPenilai(): Promise<PejabatPenilai> {
    if (this.pgAvailable) {
      const result = await query('SELECT * FROM pejabat_penilai LIMIT 1');
      if (result.rows.length) return result.rows[0];
      return { id: 'pjb-001', nama: 'Mohamad Amin, S.HI', nip: '197203102001121001', jabatan: 'Kepala KUA Ampelgading', stempel_url: '', tanda_tangan_url: '', opsi_anchor_ttd: '^', updated_at: new Date().toISOString() };
    }
    return this.jsonData.pejabatPenilai;
  }

  async updatePejabatPenilai(updates: Partial<PejabatPenilai>): Promise<PejabatPenilai> {
    if (this.pgAvailable) {
      const existing = await query('SELECT id FROM pejabat_penilai LIMIT 1');
      const fields: string[] = []; const vals: any[] = []; let idx = 1;
      for (const k of ['nama','nip','jabatan','stempel_url','tanda_tangan_url']) {
        if ((updates as any)[k] !== undefined) { fields.push(`${k} = $${idx++}`); vals.push((updates as any)[k]); }
      }
      fields.push('updated_at = CURRENT_TIMESTAMP');
      if (existing.rows.length) {
        vals.push(existing.rows[0].id);
        await query(`UPDATE pejabat_penilai SET ${fields.join(', ')} WHERE id = $${idx}`, vals);
      } else {
        await query(`INSERT INTO pejabat_penilai (nama, nip, jabatan, stempel_url, tanda_tangan_url) VALUES ($1,$2,$3,$4,$5)`, [updates.nama || '', updates.nip || '', updates.jabatan || '', updates.stempel_url || '', updates.tanda_tangan_url || '']);
      }
      const result = await query('SELECT * FROM pejabat_penilai LIMIT 1');
      return result.rows[0];
    }
    this.jsonData.pejabatPenilai = { ...this.jsonData.pejabatPenilai, ...updates, updated_at: new Date().toISOString() };
    this.jsonSave();
    return this.jsonData.pejabatPenilai;
  }

  async getTelegramLogs(): Promise<TelegramLog[]> {
    if (this.pgAvailable) {
      const result = await query('SELECT * FROM telegram_logs ORDER BY timestamp DESC LIMIT 100');
      return result.rows.map((r: any) => ({ ...r, timestamp: r.timestamp?.toISOString?.() || r.timestamp }));
    }
    return this.jsonData.telegramLogs || [];
  }

  async addTelegramLog(log: Omit<TelegramLog, 'id' | 'timestamp'>): Promise<TelegramLog> {
    const now = new Date().toISOString();
    if (this.pgAvailable) {
      const result = await query(`
        INSERT INTO telegram_logs (command, chat_id, user_name, message, status)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *
      `, [log.command, log.chat_id, log.user_name, log.message, log.status]);
      const r = result.rows[0];
      return { ...r, timestamp: r.timestamp?.toISOString?.() || r.timestamp };
    }
    if (!this.jsonData.telegramLogs) this.jsonData.telegramLogs = [];
    const newLog: TelegramLog = { ...log, id: `tg-${Date.now()}`, timestamp: now };
    this.jsonData.telegramLogs.unshift(newLog);
    if (this.jsonData.telegramLogs.length > 100) this.jsonData.telegramLogs = this.jsonData.telegramLogs.slice(0, 100);
    this.jsonSave();
    return newLog;
  }

  async getUserActivityTemplates(userId: string): Promise<UserActivityTemplate[]> {
    if (this.pgAvailable) {
      const result = await query('SELECT * FROM user_activity_templates WHERE user_id = $1 ORDER BY activity_type_key', [userId]);
      return result.rows;
    }
    if (!this.jsonData.userActivityTemplates) this.jsonData.userActivityTemplates = [];
    return this.jsonData.userActivityTemplates.filter(t => t.user_id === userId);
  }

  async getUserActivityTemplatesMap(userId: string): Promise<UserActivityTemplatesMap> {
    const templates = await this.getUserActivityTemplates(userId);
    const map: UserActivityTemplatesMap = {};
    templates.forEach(t => { map[t.activity_type_key] = { kegiatan: t.kegiatan, pekerjaan: t.pekerjaan }; });
    return map;
  }

  async upsertUserActivityTemplate(userId: string, activityTypeKey: string, data: { kegiatan: string; pekerjaan: string }): Promise<UserActivityTemplate> {
    if (this.pgAvailable) {
      const result = await query(`
        INSERT INTO user_activity_templates (user_id, activity_type_key, kegiatan, pekerjaan)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (user_id, activity_type_key)
        DO UPDATE SET kegiatan = EXCLUDED.kegiatan, pekerjaan = EXCLUDED.pekerjaan, updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [userId, activityTypeKey, data.kegiatan, data.pekerjaan]);
      return result.rows[0];
    }
    if (!this.jsonData.userActivityTemplates) this.jsonData.userActivityTemplates = [];
    const idx = this.jsonData.userActivityTemplates.findIndex(t => t.user_id === userId && t.activity_type_key === activityTypeKey);
    const now = new Date().toISOString();
    if (idx !== -1) {
      this.jsonData.userActivityTemplates[idx] = { ...this.jsonData.userActivityTemplates[idx], kegiatan: data.kegiatan, pekerjaan: data.pekerjaan, updated_at: now };
      this.jsonSave();
      return this.jsonData.userActivityTemplates[idx];
    } else {
      const template: UserActivityTemplate = { id: `ut-${Date.now()}-${Math.floor(Math.random() * 1000)}`, user_id: userId, activity_type_key: activityTypeKey, kegiatan: data.kegiatan, pekerjaan: data.pekerjaan, created_at: now, updated_at: now };
      this.jsonData.userActivityTemplates.push(template); this.jsonSave();
      return template;
    }
  }

  async bulkUpsertUserActivityTemplates(userId: string, templates: Array<{ activity_type_key: string; kegiatan: string; pekerjaan: string }>): Promise<UserActivityTemplate[]> {
    const results: UserActivityTemplate[] = [];
    for (const t of templates) {
      results.push(await this.upsertUserActivityTemplate(userId, t.activity_type_key, { kegiatan: t.kegiatan, pekerjaan: t.pekerjaan }));
    }
    return results;
  }

  async deleteUserActivityTemplate(userId: string, activityTypeKey: string): Promise<boolean> {
    if (this.pgAvailable) {
      const result = await query('DELETE FROM user_activity_templates WHERE user_id = $1 AND activity_type_key = $2', [userId, activityTypeKey]);
      return result.rowCount !== null && result.rowCount > 0;
    }
    if (!this.jsonData.userActivityTemplates) return false;
    const initLen = this.jsonData.userActivityTemplates.length;
    this.jsonData.userActivityTemplates = this.jsonData.userActivityTemplates.filter(t => !(t.user_id === userId && t.activity_type_key === activityTypeKey));
    if (this.jsonData.userActivityTemplates.length !== initLen) { this.jsonSave(); return true; }
    return false;
  }
}

export const db = Database.getInstance();
