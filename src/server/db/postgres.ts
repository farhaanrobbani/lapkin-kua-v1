import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://kua_user:kua_password@postgres:5432/kua_db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export async function isConnected(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export async function initializeSchema() {
  const schema = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staf')),
      nama VARCHAR(255) NOT NULL,
      nip VARCHAR(50) NOT NULL,
      jabatan VARCHAR(255) NOT NULL,
      level_jabatan VARCHAR(255),
      pangkat VARCHAR(255),
      ruang_golongan VARCHAR(50),
      grade_tukin INT DEFAULT 8,
      jumlah_tukin_kotor DECIMAL(15, 2) DEFAULT 0,
      jumlah_tukin_bersih DECIMAL(15, 2) DEFAULT 0,
      gapok DECIMAL(15, 2) DEFAULT 0,
      foto_profil_url TEXT,
      tanda_tangan_url TEXT,
      instansi VARCHAR(255) DEFAULT 'KUA Ampelgading',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kua_daily_data (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tanggal DATE UNIQUE NOT NULL,
      pendaftaran_nikah_kantor INT DEFAULT 0,
      pendaftaran_nikah_luar_kantor INT DEFAULT 0,
      pelaksanaan_nikah_kantor INT DEFAULT 0,
      pelaksanaan_nikah_luar_kantor INT DEFAULT 0,
      pelaksanaan_bimwin INT DEFAULT 0,
      duplikat_buku_nikah INT DEFAULT 0,
      surat_rekomendasi_nikah INT DEFAULT 0,
      legalisir_buku_nikah INT DEFAULT 0,
      surat_keluar INT DEFAULT 0,
      pelaksanaan_wakaf INT DEFAULT 0,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS staff_activities (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tanggal DATE NOT NULL,
      kegiatan TEXT NOT NULL,
      pekerjaan TEXT NOT NULL,
      activity_type_key VARCHAR(100),
      total_jumlah INT DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pejabat_penilai (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      nama VARCHAR(255) NOT NULL,
      nip VARCHAR(50) NOT NULL,
      jabatan VARCHAR(255) NOT NULL,
      stempel_url TEXT,
      tanda_tangan_url TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS telegram_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      command TEXT NOT NULL,
      chat_id VARCHAR(100) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'received', 'failed')),
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_activity_templates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_type_key VARCHAR(100) NOT NULL,
      kegiatan TEXT NOT NULL,
      pekerjaan TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, activity_type_key)
    );

    CREATE INDEX IF NOT EXISTS idx_kua_daily_tanggal ON kua_daily_data(tanggal);
    CREATE INDEX IF NOT EXISTS idx_staff_activities_user_date ON staff_activities(user_id, tanggal);
  `;

  await query(schema);
}

export async function seedInitialData() {
  const existingUsers = await query('SELECT COUNT(*) FROM users');
  if (parseInt(existingUsers.rows[0].count) > 0) return;

  const adminHash = bcrypt.hashSync('admin123', 10);
  const stafHash = bcrypt.hashSync('staf123', 10);

  const admin = await query(`
    INSERT INTO users (id, email, password, role, nama, nip, jabatan, level_jabatan, pangkat, ruang_golongan, grade_tukin, jumlah_tukin_kotor, jumlah_tukin_bersih, gapok, foto_profil_url, tanda_tangan_url, instansi)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING id
  `, [
    'usr-admin-001', 'admin@kua.go.id', adminHash, 'admin',
    'H. Bambang Sugiarto, S.Ag', '198005122008011012',
    'Pengelola Laporan KUA & Keuangan', 'Pelaksana', 'Penata Muda Tk. I', 'III/b',
    7, 3915000, 3719250, 3400000,
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=300',
    'KUA Ampelgading'
  ]);

  const staf = await query(`
    INSERT INTO users (id, email, password, role, nama, nip, jabatan, level_jabatan, pangkat, ruang_golongan, grade_tukin, jumlah_tukin_kotor, jumlah_tukin_bersih, gapok, foto_profil_url, tanda_tangan_url, instansi)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING id
  `, [
    'usr-staf-001', 'staf@kua.go.id', stafHash, 'staf',
    'Ahmad Fauzi, S.HI', '198808152014031002',
    'Penghulu Ahli Pertama', 'Fungsional', 'Penata Muda', 'III/a',
    8, 4595000, 4365250, 3600000,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=300',
    'KUA Ampelgading'
  ]);

  const adminId = admin.rows[0].id;
  const stafId = staf.rows[0].id;

  await query(`
    INSERT INTO pejabat_penilai (id, nama, nip, jabatan, stempel_url, tanda_tangan_url)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    'pjb-001', 'Mohamad Amin, S.HI', '197203102001121001', 'Kepala KUA Ampelgading',
    'https://upload.wikimedia.org/wikipedia/commons/2/23/Official_stamp_placeholder.png',
    'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=300'
  ]);

  for (let day = 1; day <= 28; day++) {
    const dateObj = new Date(2026, 6, day);
    if (dateObj.getDay() === 0 || dateObj.getDay() === 6) continue;

    const tanggal = `2026-07-${day < 10 ? '0' + day : day}`;
    const d = day;

    const daily = await query(`
      INSERT INTO kua_daily_data (id, tanggal, pendaftaran_nikah_kantor, pendaftaran_nikah_luar_kantor, pelaksanaan_nikah_kantor, pelaksanaan_nikah_luar_kantor, pelaksanaan_bimwin, duplikat_buku_nikah, surat_rekomendasi_nikah, legalisir_buku_nikah, surat_keluar, pelaksanaan_wakaf, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING pendaftaran_nikah_kantor, pendaftaran_nikah_luar_kantor, pelaksanaan_nikah_luar_kantor, legalisir_buku_nikah, surat_keluar
    `, [
      `kua-daily-${day}`, tanggal,
      (d % 3 === 0) ? 2 : 1, (d % 2 === 0) ? 3 : 1,
      (d % 4 === 0) ? 1 : 0, (d % 5 === 0) ? 2 : 1,
      (d % 7 === 0) ? 12 : 0, (d % 6 === 0) ? 1 : 0,
      (d % 2 === 0) ? 2 : 1, (d % 3 === 0) ? 4 : 2,
      (d % 2 === 0) ? 3 : 1, (d % 10 === 0) ? 1 : 0,
      adminId
    ]);

    const r = daily.rows[0];
    const totalPendaftaran = r.pendaftaran_nikah_kantor + r.pendaftaran_nikah_luar_kantor;

    await query(`
      INSERT INTO staff_activities (user_id, tanggal, kegiatan, pekerjaan, activity_type_key, total_jumlah)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      stafId, tanggal,
      'Pelaksanaan Pemeriksaan Calon Pengantin (Pemeriksaan Nikah)',
      'Memeriksa kelengkapan berkas pendaftaran nikah dan mewawancarai calon pengantin.',
      'pendaftaran_nikah_kantor', totalPendaftaran
    ]);

    if (r.pelaksanaan_nikah_luar_kantor > 0) {
      await query(`
        INSERT INTO staff_activities (user_id, tanggal, kegiatan, pekerjaan, activity_type_key, total_jumlah)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        stafId, tanggal,
        'Pelayanan dan Pengawasan Akad Nikah di Luar Kantor',
        'Menghadiri, memandu, dan memimpin akad nikah di lokasi bedol calon pengantin.',
        'pelaksanaan_nikah_luar_kantor', r.pelaksanaan_nikah_luar_kantor
      ]);
    }

    await query(`
      INSERT INTO staff_activities (user_id, tanggal, kegiatan, pekerjaan, activity_type_key, total_jumlah)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      adminId, tanggal,
      'Pengelolaan, Pencatatan, dan Pengiriman Surat Keluar',
      'Pengelolaan, pencatatan agenda surat dinas KUA, dan verifikasi dokumen keuangan.',
      'surat_keluar', r.surat_keluar || 1
    ]);

    if (r.legalisir_buku_nikah > 0) {
      await query(`
        INSERT INTO staff_activities (user_id, tanggal, kegiatan, pekerjaan, activity_type_key, total_jumlah)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        adminId, tanggal,
        'Pelayanan Legalisir Buku Nikah',
        'Pemeriksaan keaslian dokumen buku nikah dan verifikasi register akta nikah.',
        'legalisir_buku_nikah', r.legalisir_buku_nikah
      ]);
    }
  }

  console.log('Seed data inserted successfully');
}
