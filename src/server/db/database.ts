import pg from 'pg';
import bcrypt from 'bcryptjs';
import { User, KuaDailyData, StaffActivity, PejabatPenilai, TelegramLog, UserActivityTemplate, UserActivityTemplatesMap } from '../../types/index.js';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://kua_user:kua_password@postgres:5432/kua_db',
  max: 20,
  idleTimeoutMillis: 30000,
});

let ready = false;

async function ensureReady() {
  if (ready) return;

  await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS telegram_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      command TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('sent', 'received', 'failed')),
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_activity_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_type_key TEXT NOT NULL,
      kegiatan TEXT NOT NULL,
      pekerjaan TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, activity_type_key)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE kua_daily_data ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb
  `);

  await pool.query(`
    ALTER TABLE pejabat_penilai ADD COLUMN IF NOT EXISTS opsi_anchor_ttd VARCHAR(10) DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS jumlah_uang_makan_harian DECIMAL(15,2) DEFAULT 35150
  `);

  const result = await pool.query('SELECT COUNT(*)::int as cnt FROM users');
  if (result.rows[0].cnt === 0) {
    await seedData();
  }

  ready = true;
}

async function seedData() {
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const stafPasswordHash = bcrypt.hashSync('staf123', 10);

  const ADMIN_ID = 'a0000000-0000-0000-0000-000000000001';
  const STAF_ID = 'a0000000-0000-0000-0000-000000000002';
  const PEJABAT_ID = 'a0000000-0000-0000-0000-000000000003';

  await pool.query(`
    INSERT INTO users (id, email, password, role, nama, nip, jabatan, level_jabatan, pangkat, ruang_golongan, grade_tukin, jumlah_tukin_kotor, jumlah_tukin_bersih, gapok, jumlah_uang_makan_harian, foto_profil_url, tanda_tangan_url, instansi) VALUES
    ($1, 'admin@kua.go.id', $2, 'admin', 'H. Bambang Sugiarto, S.Ag', '198005122008011012', 'Pengelola Laporan KUA & Keuangan', 'Pelaksana', 'Penata Muda Tk. I', 'III/b', 7, 3915000, 3719250, 3400000, 35150, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=300', 'KUA Ampelgading'),
    ($3, 'staf@kua.go.id', $4, 'staf', 'Ahmad Fauzi, S.HI', '198808152014031002', 'Penghulu Ahli Pertama', 'Fungsional', 'Penata Muda', 'III/a', 8, 4595000, 4365250, 3600000, 35150, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=300', 'KUA Ampelgading')
  `, [ADMIN_ID, adminPasswordHash, STAF_ID, stafPasswordHash]);

  await pool.query(`
    INSERT INTO pejabat_penilai (id, nama, nip, jabatan, stempel_url, tanda_tangan_url, opsi_anchor_ttd) VALUES
    ($1, 'Mohamad Amin, S.HI', '197203102001121001', 'Kepala KUA Ampelgading', 'https://upload.wikimedia.org/wikipedia/commons/2/23/Official_stamp_placeholder.png', 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=300', '#')
  `, [PEJABAT_ID]);

  await pool.query(`
    INSERT INTO app_settings (key, value) VALUES ('kua_instansi', 'KUA Ampelgading')
    ON CONFLICT (key) DO NOTHING
  `);

  const year = 2026;
  const month = 7;

  for (let day = 1; day <= 28; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const tanggal = `${year}-07-${dayStr}`;
    const dateObj = new Date(year, month - 1, day);
    if (dateObj.getDay() === 0 || dateObj.getDay() === 6) continue;

    await pool.query(`
      INSERT INTO kua_daily_data (tanggal, pendaftaran_nikah_kantor, pendaftaran_nikah_luar_kantor, pelaksanaan_nikah_kantor, pelaksanaan_nikah_luar_kantor, pelaksanaan_bimwin, duplikat_buku_nikah, surat_rekomendasi_nikah, legalisir_buku_nikah, surat_keluar, pelaksanaan_wakaf, created_by) VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `, [
      tanggal,
      day % 3 === 0 ? 2 : 1,
      day % 2 === 0 ? 3 : 1,
      day % 4 === 0 ? 1 : 0,
      day % 5 === 0 ? 2 : 1,
      day % 7 === 0 ? 12 : 0,
      day % 6 === 0 ? 1 : 0,
      day % 2 === 0 ? 2 : 1,
      day % 3 === 0 ? 4 : 2,
      day % 2 === 0 ? 3 : 1,
      day % 10 === 0 ? 1 : 0,
      ADMIN_ID
    ]);

    const totalPendaftaran = (day % 3 === 0 ? 2 : 1) + (day % 2 === 0 ? 3 : 1);
    await pool.query(`
      INSERT INTO staff_activities (user_id, tanggal, kegiatan, pekerjaan, total_jumlah) VALUES
      ($1,$2,'Pelaksanaan Pemeriksaan Calon Pengantin (Pemeriksaan Nikah)','Memeriksa kelengkapan berkas pendaftaran nikah dan mewawancarai calon pengantin.',$3)
    `, [STAF_ID, tanggal, totalPendaftaran]);

    await pool.query(`
      INSERT INTO staff_activities (user_id, tanggal, kegiatan, pekerjaan, total_jumlah) VALUES
      ($1,$2,'Pelayanan dan Pengawasan Akad Nikah di Luar Kantor','Menghadiri, memandu, dan memimpin akad nikah di lokasi bedol calon pengantin.',$3)
    `, [STAF_ID, tanggal, day % 5 === 0 ? 2 : 1]);

    await pool.query(`
      INSERT INTO staff_activities (user_id, tanggal, kegiatan, pekerjaan, total_jumlah) VALUES
      ($1,$2,'Pengelolaan, Pencatatan, dan Pengiriman Surat Keluar','Pengelolaan, pencatatan agenda surat dinas KUA, dan verifikasi dokumen keuangan.',$3)
    `, [ADMIN_ID, tanggal, day % 2 === 0 ? 3 : 1]);

    const legalisirCount = day % 3 === 0 ? 4 : 2;
    await pool.query(`
      INSERT INTO staff_activities (user_id, tanggal, kegiatan, pekerjaan, total_jumlah) VALUES
      ($1,$2,'Pelayanan Legalisir Buku Nikah','Pemeriksaan keaslian dokumen buku nikah dan verifikasi register akta nikah.',$3)
    `, [ADMIN_ID, tanggal, legalisirCount]);
  }
}

function rowToUser(row: any, includePassword = false): User {
  const user: User = {
    id: row.id,
    email: row.email,
    role: row.role,
    nama: row.nama,
    nip: row.nip,
    jabatan: row.jabatan,
    level_jabatan: row.level_jabatan || '',
    pangkat: row.pangkat || '',
    ruang_golongan: row.ruang_golongan || '',
    grade_tukin: row.grade_tukin || 0,
    jumlah_tukin_kotor: Number(row.jumlah_tukin_kotor) || 0,
    jumlah_tukin_bersih: Number(row.jumlah_tukin_bersih) || 0,
    gapok: Number(row.gapok) || 0,
    jumlah_uang_makan_harian: Number(row.jumlah_uang_makan_harian) || 35150,
    foto_profil_url: row.foto_profil_url || '',
    tanda_tangan_url: row.tanda_tangan_url || '',
    instansi: row.instansi || 'KUA Ampelgading',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  if (includePassword) {
    (user as any)._passwordHash = row.password;
  }
  return user;
}

function rowToKuaDaily(row: any): KuaDailyData {
  const customFields = (row.custom_fields && typeof row.custom_fields === 'object') ? row.custom_fields : {};
  return {
    id: row.id,
    tanggal: row.tanggal ? row.tanggal.toISOString ? row.tanggal.toISOString().split('T')[0] : String(row.tanggal) : '',
    pendaftaran_nikah_kantor: row.pendaftaran_nikah_kantor || 0,
    pendaftaran_nikah_luar_kantor: row.pendaftaran_nikah_luar_kantor || 0,
    pelaksanaan_nikah_kantor: row.pelaksanaan_nikah_kantor || 0,
    pelaksanaan_nikah_luar_kantor: row.pelaksanaan_nikah_luar_kantor || 0,
    pelaksanaan_bimwin: row.pelaksanaan_bimwin || 0,
    duplikat_buku_nikah: row.duplikat_buku_nikah || 0,
    surat_rekomendasi_nikah: row.surat_rekomendasi_nikah || 0,
    legalisir_buku_nikah: row.legalisir_buku_nikah || 0,
    surat_keluar: row.surat_keluar || 0,
    pelaksanaan_wakaf: row.pelaksanaan_wakaf || 0,
    ...customFields,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToStaffActivity(row: any): StaffActivity {
  return {
    id: row.id,
    user_id: row.user_id,
    tanggal: row.tanggal ? (row.tanggal.toISOString ? row.tanggal.toISOString().split('T')[0] : String(row.tanggal)) : '',
    kegiatan: row.kegiatan,
    pekerjaan: row.pekerjaan,
    total_jumlah: row.total_jumlah || 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToPejabatPenilai(row: any): PejabatPenilai {
  return {
    id: row.id,
    nama: row.nama,
    nip: row.nip,
    jabatan: row.jabatan,
    stempel_url: row.stempel_url || '',
    tanda_tangan_url: row.tanda_tangan_url || '',
    opsi_anchor_ttd: row.opsi_anchor_ttd || '',
    updated_at: row.updated_at,
  };
}

function rowToTelegramLog(row: any): TelegramLog {
  return {
    id: row.id,
    command: row.command,
    chat_id: row.chat_id,
    user_name: row.user_name,
    message: row.message,
    status: row.status,
    timestamp: row.timestamp,
  };
}

function rowToActivityTemplate(row: any): UserActivityTemplate {
  return {
    id: row.id,
    user_id: row.user_id,
    activity_type_key: row.activity_type_key,
    kegiatan: row.kegiatan,
    pekerjaan: row.pekerjaan,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const KUA_DAILY_FIELDS = [
  'pendaftaran_nikah_kantor', 'pendaftaran_nikah_luar_kantor',
  'pelaksanaan_nikah_kantor', 'pelaksanaan_nikah_luar_kantor',
  'pelaksanaan_bimwin', 'duplikat_buku_nikah',
  'surat_rekomendasi_nikah', 'legalisir_buku_nikah',
  'surat_keluar', 'pelaksanaan_wakaf',
];

export const db = {
  async getUsers(): Promise<User[]> {
    await ensureReady();
    const result = await pool.query('SELECT * FROM users ORDER BY created_at');
    return result.rows.map(r => rowToUser(r));
  },

  async getUserById(id: string): Promise<User | undefined> {
    await ensureReady();
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return rowToUser(result.rows[0]);
  },

  async getUserByEmail(email: string): Promise<(User & { _passwordHash?: string }) | undefined> {
    await ensureReady();
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (result.rows.length === 0) return undefined;
    return rowToUser(result.rows[0], true) as any;
  },

  async createUser(user: User, passwordRaw: string): Promise<User> {
    await ensureReady();
    const passwordHash = bcrypt.hashSync(passwordRaw, 10);
    const id = user.id || undefined;
    const defaultInstansi = await getKuaInstansi();
    const result = await pool.query(`
      INSERT INTO users (id, email, password, role, nama, nip, jabatan, level_jabatan, pangkat, ruang_golongan, grade_tukin, jumlah_tukin_kotor, jumlah_tukin_bersih, gapok, jumlah_uang_makan_harian, foto_profil_url, tanda_tangan_url, instansi)
      VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      id, user.email, passwordHash, user.role, user.nama, user.nip,
      user.jabatan || 'Staf / Pegawai KUA', user.level_jabatan || 'Pelaksana',
      user.pangkat || 'Penata Muda', user.ruang_golongan || 'III/a',
      user.grade_tukin || 8, user.jumlah_tukin_kotor || 0, user.jumlah_tukin_bersih || 0,
      user.gapok || 0, user.jumlah_uang_makan_harian || 35150, user.foto_profil_url || '', user.tanda_tangan_url || '',
      user.instansi || defaultInstansi,
    ]);
    return rowToUser(result.rows[0]);
  },

  async updateUser(id: string, updates: Partial<User> & { password?: string }): Promise<User | null> {
    await ensureReady();
    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) return null;

    const current = existing.rows[0];
    const newPassword = updates.password ? bcrypt.hashSync(updates.password, 10) : current.password;
    delete (updates as any).password;

    const merged = { ...current, ...updates, updated_at: new Date().toISOString() };

    const result = await pool.query(`
      UPDATE users SET email=$1, password=$2, role=$3, nama=$4, nip=$5, jabatan=$6, level_jabatan=$7, pangkat=$8, ruang_golongan=$9, grade_tukin=$10, jumlah_tukin_kotor=$11, jumlah_tukin_bersih=$12, gapok=$13, jumlah_uang_makan_harian=$14, foto_profil_url=$15, tanda_tangan_url=$16, instansi=$17, updated_at=$18
      WHERE id=$19 RETURNING *
    `, [
      merged.email, newPassword, merged.role, merged.nama, merged.nip,
      merged.jabatan, merged.level_jabatan, merged.pangkat, merged.ruang_golongan,
      merged.grade_tukin, merged.jumlah_tukin_kotor, merged.jumlah_tukin_bersih, merged.gapok,
      merged.jumlah_uang_makan_harian, merged.foto_profil_url, merged.tanda_tangan_url, merged.instansi,
      merged.updated_at, id,
    ]);
    return rowToUser(result.rows[0]);
  },

  async deleteUser(id: string): Promise<boolean> {
    await ensureReady();
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getKuaDailyData(month?: number, year?: number): Promise<KuaDailyData[]> {
    await ensureReady();
    let query = 'SELECT * FROM kua_daily_data';
    const params: any[] = [];
    if (year && month) {
      query += " WHERE EXTRACT(YEAR FROM tanggal) = $1 AND EXTRACT(MONTH FROM tanggal) = $2";
      params.push(year, month);
    }
    query += ' ORDER BY tanggal';
    const result = await pool.query(query, params);
    return result.rows.map(rowToKuaDaily);
  },

  async getKuaDailyByDate(tanggal: string): Promise<KuaDailyData | undefined> {
    await ensureReady();
    const result = await pool.query('SELECT * FROM kua_daily_data WHERE tanggal = $1', [tanggal]);
    if (result.rows.length === 0) return undefined;
    return rowToKuaDaily(result.rows[0]);
  },

  async upsertKuaDailyData(data: Record<string, any>): Promise<KuaDailyData> {
    await ensureReady();
    const tanggal = data.tanggal;
    if (!tanggal) throw new Error('tanggal wajib diisi');

    const existing = await pool.query('SELECT * FROM kua_daily_data WHERE tanggal = $1', [tanggal]);
    const now = new Date().toISOString();

    const fields: Record<string, any> = { tanggal };
    for (const key of KUA_DAILY_FIELDS) {
      fields[key] = data[key] !== undefined ? (typeof data[key] === 'number' ? data[key] : (Number(data[key]) || 0)) : 0;
    }
    fields.created_by = data.created_by || null;
    fields.updated_at = now;

    const systemFields = new Set(['id', 'tanggal', 'created_by', 'created_at', 'updated_at', ...KUA_DAILY_FIELDS]);
    const customFields: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (!systemFields.has(key)) {
        customFields[key] = typeof val === 'number' ? val : (Number(val) || 0);
      }
    }

    const setFragments: string[] = [];
    const setValues: any[] = [];
    let idx = 1;

    for (const key of [...KUA_DAILY_FIELDS, 'custom_fields', 'created_by', 'updated_at']) {
      setFragments.push(`${key}=$${idx}`);
      setValues.push(key === 'custom_fields' ? JSON.stringify(customFields) : fields[key]);
      idx++;
    }
    setValues.push(tanggal);

    if (existing.rows.length > 0) {
      const result = await pool.query(`
        UPDATE kua_daily_data SET ${setFragments.join(', ')} WHERE tanggal=$${idx} RETURNING *
      `, setValues);
      return rowToKuaDaily(result.rows[0]);
    } else {
      const insertFields = ['id', 'tanggal', ...KUA_DAILY_FIELDS, 'custom_fields', 'created_by', 'created_at', 'updated_at'];
      const insertPlaceholders = ['gen_random_uuid()', '$1', ...KUA_DAILY_FIELDS.map((_, i) => `$${i + 2}`), `$${KUA_DAILY_FIELDS.length + 2}`, `$${KUA_DAILY_FIELDS.length + 3}`, `$${KUA_DAILY_FIELDS.length + 4}`, `$${KUA_DAILY_FIELDS.length + 5}`];
      const insertValues = [tanggal, ...KUA_DAILY_FIELDS.map(k => fields[k]), JSON.stringify(customFields), fields.created_by, now, now];
      const result = await pool.query(`
        INSERT INTO kua_daily_data (${insertFields.join(', ')}) VALUES (${insertPlaceholders.join(', ')}) RETURNING *
      `, insertValues);
      return rowToKuaDaily(result.rows[0]);
    }
  },

  async deleteKuaDailyData(id: string): Promise<boolean> {
    await ensureReady();
    const result = await pool.query('DELETE FROM kua_daily_data WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getStaffActivities(userId?: string, month?: number, year?: number): Promise<StaffActivity[]> {
    await ensureReady();
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (userId) {
      conditions.push(`user_id = $${idx++}`);
      params.push(userId);
    }
    if (year && month) {
      conditions.push(`EXTRACT(YEAR FROM tanggal) = $${idx++}`);
      params.push(year);
      conditions.push(`EXTRACT(MONTH FROM tanggal) = $${idx++}`);
      params.push(month);
    }
    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await pool.query(`SELECT * FROM staff_activities ${where} ORDER BY tanggal`, params);
    return result.rows.map(rowToStaffActivity);
  },

  async createStaffActivity(activity: Omit<StaffActivity, 'id' | 'created_at' | 'updated_at'>): Promise<StaffActivity> {
    await ensureReady();
    const result = await pool.query(`
      INSERT INTO staff_activities (user_id, tanggal, kegiatan, pekerjaan, total_jumlah)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [activity.user_id, activity.tanggal, activity.kegiatan, activity.pekerjaan, activity.total_jumlah || 1]);
    return rowToStaffActivity(result.rows[0]);
  },

  async updateStaffActivity(id: string, updates: Partial<StaffActivity>): Promise<StaffActivity | null> {
    await ensureReady();
    const existing = await pool.query('SELECT * FROM staff_activities WHERE id = $1', [id]);
    if (existing.rows.length === 0) return null;

    const merged = { ...existing.rows[0], ...updates, updated_at: new Date().toISOString() };
    const result = await pool.query(`
      UPDATE staff_activities SET user_id=$1, tanggal=$2, kegiatan=$3, pekerjaan=$4, total_jumlah=$5, updated_at=$6
      WHERE id=$7 RETURNING *
    `, [merged.user_id, merged.tanggal, merged.kegiatan, merged.pekerjaan, merged.total_jumlah, merged.updated_at, id]);
    return rowToStaffActivity(result.rows[0]);
  },

  async deleteStaffActivity(id: string): Promise<boolean> {
    await ensureReady();
    const result = await pool.query('DELETE FROM staff_activities WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getPejabatPenilai(): Promise<PejabatPenilai> {
    await ensureReady();
    const result = await pool.query('SELECT * FROM pejabat_penilai LIMIT 1');
    if (result.rows.length === 0) {
      return {
        id: '',
        nama: '',
        nip: '',
        jabatan: '',
        stempel_url: '',
        tanda_tangan_url: '',
        opsi_anchor_ttd: '',
        updated_at: '',
      };
    }
    return rowToPejabatPenilai(result.rows[0]);
  },

  async updatePejabatPenilai(updates: Partial<PejabatPenilai>): Promise<PejabatPenilai> {
    await ensureReady();
    const existing = await pool.query('SELECT * FROM pejabat_penilai LIMIT 1');
    const now = new Date().toISOString();

    if (existing.rows.length > 0) {
      const merged = { ...existing.rows[0], ...updates, updated_at: now };
      const result = await pool.query(`
        UPDATE pejabat_penilai SET nama=$1, nip=$2, jabatan=$3, stempel_url=$4, tanda_tangan_url=$5, opsi_anchor_ttd=$6, updated_at=$7
        WHERE id=$8 RETURNING *
      `, [merged.nama, merged.nip, merged.jabatan, merged.stempel_url || '', merged.tanda_tangan_url || '', merged.opsi_anchor_ttd || '', now, existing.rows[0].id]);
      return rowToPejabatPenilai(result.rows[0]);
    } else {
      const result = await pool.query(`
        INSERT INTO pejabat_penilai (nama, nip, jabatan, stempel_url, tanda_tangan_url, opsi_anchor_ttd, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
      `, [updates.nama, updates.nip, updates.jabatan, updates.stempel_url || '', updates.tanda_tangan_url || '', updates.opsi_anchor_ttd || '', now]);
      return rowToPejabatPenilai(result.rows[0]);
    }
  },

  async getTelegramLogs(): Promise<TelegramLog[]> {
    await ensureReady();
    const result = await pool.query('SELECT * FROM telegram_logs ORDER BY timestamp DESC');
    return result.rows.map(rowToTelegramLog);
  },

  async addTelegramLog(log: Omit<TelegramLog, 'id' | 'timestamp'>): Promise<TelegramLog> {
    await ensureReady();
    const result = await pool.query(`
      INSERT INTO telegram_logs (command, chat_id, user_name, message, status)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [log.command, log.chat_id, log.user_name, log.message, log.status]);
    return rowToTelegramLog(result.rows[0]);
  },

  async getUserActivityTemplates(userId: string): Promise<UserActivityTemplate[]> {
    await ensureReady();
    const result = await pool.query('SELECT * FROM user_activity_templates WHERE user_id = $1 ORDER BY activity_type_key', [userId]);
    return result.rows.map(rowToActivityTemplate);
  },

  async getUserActivityTemplatesMap(userId: string): Promise<UserActivityTemplatesMap> {
    await ensureReady();
    const templates = await db.getUserActivityTemplates(userId);
    const map: UserActivityTemplatesMap = {};
    templates.forEach(t => {
      map[t.activity_type_key] = { kegiatan: t.kegiatan, pekerjaan: t.pekerjaan };
    });
    return map;
  },

  async upsertUserActivityTemplate(
    userId: string,
    activityTypeKey: string,
    data: { kegiatan: string; pekerjaan: string }
  ): Promise<UserActivityTemplate> {
    await ensureReady();
    const now = new Date().toISOString();

    const existing = await pool.query(
      'SELECT * FROM user_activity_templates WHERE user_id = $1 AND activity_type_key = $2',
      [userId, activityTypeKey]
    );

    if (existing.rows.length > 0) {
      const result = await pool.query(`
        UPDATE user_activity_templates SET kegiatan=$1, pekerjaan=$2, updated_at=$3
        WHERE user_id=$4 AND activity_type_key=$5 RETURNING *
      `, [data.kegiatan, data.pekerjaan, now, userId, activityTypeKey]);
      return rowToActivityTemplate(result.rows[0]);
    } else {
      const result = await pool.query(`
        INSERT INTO user_activity_templates (user_id, activity_type_key, kegiatan, pekerjaan, updated_at)
        VALUES ($1, $2, $3, $4, $5) RETURNING *
      `, [userId, activityTypeKey, data.kegiatan, data.pekerjaan, now]);
      return rowToActivityTemplate(result.rows[0]);
    }
  },

  async bulkUpsertUserActivityTemplates(
    userId: string,
    templates: Array<{ activity_type_key: string; kegiatan: string; pekerjaan: string }>
  ): Promise<UserActivityTemplate[]> {
    const results: UserActivityTemplate[] = [];
    for (const t of templates) {
      const r = await db.upsertUserActivityTemplate(userId, t.activity_type_key, {
        kegiatan: t.kegiatan,
        pekerjaan: t.pekerjaan,
      });
      results.push(r);
    }
    return results;
  },

  async deleteUserActivityTemplate(userId: string, activityTypeKey: string): Promise<boolean> {
    await ensureReady();
    const result = await pool.query(
      'DELETE FROM user_activity_templates WHERE user_id = $1 AND activity_type_key = $2',
      [userId, activityTypeKey]
    );
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getSettings(): Promise<Record<string, string>> {
    await ensureReady();
    const result = await pool.query('SELECT key, value FROM app_settings');
    const settings: Record<string, string> = {};
    result.rows.forEach(r => { settings[r.key] = r.value; });
    return settings;
  },

  async updateSetting(key: string, value: string): Promise<void> {
    await ensureReady();
    await pool.query(`
      INSERT INTO app_settings (key, value) VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
    `, [key, value]);
  },

  async getKuaInstansi(): Promise<string> {
    await ensureReady();
    try {
      const result = await pool.query("SELECT value FROM app_settings WHERE key = 'kua_instansi'");
      if (result.rows.length > 0 && result.rows[0].value) return result.rows[0].value;
    } catch {}
    return 'KUA Ampelgading';
  },

  async getAvailableYears(): Promise<number[]> {
    await ensureReady();
    const result = await pool.query(`
      SELECT DISTINCT EXTRACT(YEAR FROM tanggal)::int AS tahun FROM kua_daily_data
      UNION
      SELECT DISTINCT EXTRACT(YEAR FROM tanggal)::int AS tahun FROM staff_activities
      ORDER BY tahun
    `);
    return result.rows.map(r => r.tahun);
  },
};

export async function initDatabase() {
  await ensureReady();
}

export async function getKuaInstansi(): Promise<string> {
  return db.getKuaInstansi();
}
