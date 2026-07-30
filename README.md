# Sistem Informasi Laporan Kinerja KUA (SILAP-KUA)

Aplikasi web Sistem Informasi Laporan Kinerja KUA (Kantor Urusan Agama) terintegrasi untuk pengelola laporan KUA (Admin) dan Staf (Penghulu, JFU, PPNPN, Penyuluh).

## Fitur Utama

1. **Role-Based Access Control (RBAC)**
   - **Admin (Pengelola Laporan KUA)**: CRUD pengguna, input & CRUD Master Data KUA Harian (10 Indikator), dan Pengaturan Pejabat Penilai / Kepala KUA.
   - **Staf / Pegawai**: Catat log pekerjaan harian dengan otomatisasi sinkronisasi volume dari Master KUA, ekspor laporan ke PDF, Excel, dan Word.

2. **Master Data Harian KUA (10 Indikator)**
   - Pendaftaran Nikah Kantor & Luar Kantor
   - Pelaksanaan Nikah Kantor & Luar Kantor
   - Pelaksanaan Bimbingan Perkawinan (Bimwin)
   - Duplikat Buku Nikah
   - Surat Rekomendasi Nikah
   - Legalisir Buku Nikah
   - Surat Keluar
   - Pelaksanaan Akta Wakaf

3. **Cetak & Ekspor Laporan Presisi (PDF, Excel, Word)**
   - **Template 1**: Laporan Kinerja Harian / Bulanan Pegawai dengan footer TTD Pejabat Penilai & Pegawai.
   - **Template 2**: REKAP LAPORAN KINERJA BULAN (Tukin, Kehadiran, Uang Makan, Laporan) dengan foto pegawai & stempel resmi KUA.

4. **Bot Telegram Official & Scheduler**
   - Webhook & auto-retry pengiriman pesan HTML.
   - Perintah: `/start`, `/today`, `/upcoming`, `/kendaraan`, `/dokumen`, `/pembayaran`.

5. **Pengaturan Pejabat Penilai Dinamis**
   - Perubahan Nama, NIP, dan Stempel Kepala KUA dilakukan langsung via panel Admin tanpa mengubah kode program.

---

## Akun Demo Default

- **Admin**: `admin@kua.go.id` | Password: `admin123`
- **Staf**: `staf@kua.go.id` | Password: `staf123`

---

## Cara Menjalankan secara Lokal

```bash
# 1. Install dependencies
npm install

# 2. Jalankan server pengembangan
npm run dev
```

Aplikasi dapat diakses di `http://localhost:3000`.

---

## Panduan Deployment Production (Ubuntu VPS + Docker)

```bash
# 1. Build & Run dengan Docker Compose
docker-compose up -d --build

# 2. ATAU Build manual dengan PM2
npm run build
pm2 start dist/server.cjs --name "silap-kua"
```
