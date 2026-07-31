-- PostgreSQL Database Migration Schema for Sistem Informasi Laporan Kinerja KUA
-- Created for Production Deployment with PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
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
    jumlah_uang_makan_harian DECIMAL(15, 2) DEFAULT 35150,
    foto_profil_url TEXT,
    tanda_tangan_url TEXT,
    instansi VARCHAR(255) DEFAULT 'KUA Ampelgading',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. KUA Daily Data Table (Managed by Admin)
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

-- 3. Staff Activities Table (Managed by Staf)
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

-- 4. Pejabat Penilai Table (For Official Stamp & Signatures)
CREATE TABLE IF NOT EXISTS pejabat_penilai (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    nip VARCHAR(50) NOT NULL,
    jabatan VARCHAR(255) NOT NULL,
    stempel_url TEXT,
    tanda_tangan_url TEXT,
    opsi_anchor_ttd VARCHAR(10) DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Telegram Logs Table
CREATE TABLE IF NOT EXISTS telegram_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    command TEXT NOT NULL,
    chat_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'received', 'failed')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. User Activity Templates Table (custom template kalimat per user per activity_type)
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

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_kua_daily_tanggal ON kua_daily_data(tanggal);
CREATE INDEX IF NOT EXISTS idx_staff_activities_user_date ON staff_activities(user_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_staff_activities_activity_key ON staff_activities(activity_type_key);
CREATE INDEX IF NOT EXISTS idx_user_templates_user_key ON user_activity_templates(user_id, activity_type_key);
