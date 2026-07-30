import * as XLSX from 'xlsx';
import { StaffActivity, User, PejabatPenilai } from '../types/index';
import { formatRupiah, formatTanggalIndo, getNamaBulan } from './formatters';

export function exportLaporanKinerjaExcel(
  user: User,
  month: number,
  year: number,
  activities: StaffActivity[],
  pejabatPenilai: PejabatPenilai,
  customCetakDate?: string
) {
  const monthName = getNamaBulan(month);
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const defaultDateStr = `${lastDayOfMonth} ${monthName} ${year}`;

  let printDateStr = defaultDateStr;
  if (customCetakDate && customCetakDate.trim() !== '') {
    const parts = customCetakDate.split(',');
    printDateStr = parts.length > 1 ? parts[1].trim() : customCetakDate.trim();
  }

  const merges: XLSX.Range[] = [];
  let r = 0;
  const sheetData: any[][] = [];

  // Title row - merged across all 4 columns
  sheetData.push(['LAPORAN KINERJA']);
  merges.push({ s: { r, c: 0 }, e: { r, c: 3 } });
  r++;

  sheetData.push(['']); r++;

  sheetData.push(['Nama', ':', user.nama]); r++;
  sheetData.push(['NIP', ':', user.nip]); r++;
  sheetData.push(['Jabatan', ':', user.jabatan]); r++;
  sheetData.push(['Pangkat', ':', user.pangkat]); r++;
  sheetData.push(['Golongan / Ruang', ':', user.ruang_golongan]); r++;
  sheetData.push(['Tanggal Dicetak', ':', printDateStr]); r++;
  sheetData.push(['']); r++;

  // Data table header
  sheetData.push(['NO', 'KEGIATAN', 'PEKERJAAN', 'TANGGAL']); r++;

  // Group by date so 1 row = 1 date
  const map = new Map<string, StaffActivity[]>();
  activities.forEach(act => {
    const list = map.get(act.tanggal) || [];
    list.push(act);
    map.set(act.tanggal, list);
  });

  const sortedDates = Array.from(map.keys()).sort();
  let no = 1;

  sortedDates.forEach(date => {
    const items = map.get(date) || [];
    const kegiatanStr = items.length === 1
      ? items[0].kegiatan
      : items.map((it, idx) => `${idx + 1}. ${it.kegiatan}`).join('\n');
      
    const pekerjaanStr = items.length === 1
      ? `${items[0].pekerjaan} (${items[0].total_jumlah})`
      : items.map((it, idx) => `${idx + 1}. ${it.pekerjaan} (${it.total_jumlah})`).join('\n');

    sheetData.push([no++, kegiatanStr, pekerjaanStr, formatTanggalIndo(date)]);
    r++;
  });

  // Empty rows after data
  sheetData.push(['']); r++;
  sheetData.push(['']); r++;

  // Signature section with merged cells (A+B) and (C+D) for each row
  sheetData.push(['Pejabat Penilai,', '', '', printDateStr]);
  merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
  merges.push({ s: { r, c: 2 }, e: { r, c: 3 } });
  r++;

  sheetData.push([pejabatPenilai.jabatan, '', '', 'Pegawai yang Dinilai,']);
  merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
  merges.push({ s: { r, c: 2 }, e: { r, c: 3 } });
  r++;

  sheetData.push(['']); r++;
  sheetData.push(['']); r++;
  sheetData.push(['']); r++;

  sheetData.push([pejabatPenilai.nama, '', '', user.nama]);
  merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
  merges.push({ s: { r, c: 2 }, e: { r, c: 3 } });
  r++;

  sheetData.push([`NIP. ${pejabatPenilai.nip}`, '', '', `NIP. ${user.nip}`]);
  merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
  merges.push({ s: { r, c: 2 }, e: { r, c: 3 } });
  r++;

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  worksheet['!cols'] = [
    { wch: 6 },   // NO (merged with B=45 in signature: 51wch)
    { wch: 45 },  // KEGIATAN
    { wch: 45 },  // PEKERJAAN (merged with D=22 in signature: 67wch)
    { wch: 22 }   // TANGGAL
  ];
  worksheet['!merges'] = merges;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Kinerja');

  XLSX.writeFile(workbook, `Laporan_Kinerja_${user.nama.replace(/\s+/g, '_')}_${monthName}_${year}.xlsx`);
}

export function exportRekapTukinExcel(
  user: User,
  month: number,
  year: number,
  pejabatPenilai: PejabatPenilai,
  totalHariKerja: number = 22,
  customCetakDate?: string
) {
  const monthName = getNamaBulan(month);
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const signatureDateStr = customCetakDate || `Malang, ${lastDayOfMonth} ${monthName} ${year}`;
  const nominalUangMakan = totalHariKerja * 35150;

  const merges: XLSX.Range[] = [];
  let r = 0;
  const sheetData: any[][] = [];

  // Title rows - merged
  sheetData.push([`REKAP LAPORAN KINERJA BULAN ${monthName.toUpperCase()} ${year}`]);
  merges.push({ s: { r, c: 0 }, e: { r, c: 3 } });
  r++;

  sheetData.push([`KANTOR URUSAN AGAMA - ${user.instansi.toUpperCase()}`]);
  merges.push({ s: { r, c: 0 }, e: { r, c: 3 } });
  r++;

  sheetData.push(['']); r++;

  sheetData.push(['Nama', ':', user.nama]); r++;
  sheetData.push(['NIP', ':', user.nip]); r++;
  sheetData.push(['Jabatan', ':', user.jabatan]); r++;
  sheetData.push(['Instansi', ':', user.instansi]); r++;
  sheetData.push(['Grade Tukin', ':', `Grade ${user.grade_tukin}`]); r++;
  sheetData.push(['Nilai Tukin (Bersih)', ':', formatRupiah(user.jumlah_tukin_bersih)]); r++;
  sheetData.push(['']); r++;

  // Data table
  sheetData.push(['NO', 'URAIAN', 'ADA / TIDAK ADA', 'KETERANGAN']); r++;
  sheetData.push([1, 'Rekap Tunjangan Kinerja', 'Ada', formatRupiah(user.jumlah_tukin_bersih)]); r++;
  sheetData.push([2, 'Rekap Kehadiran', 'Ada', `${totalHariKerja} Hari`]); r++;
  sheetData.push([3, 'Rekap Uang Makan', 'Ada', formatRupiah(nominalUangMakan)]); r++;
  sheetData.push([4, 'Laporan Kinerja', 'Ada', '1 Laporan']); r++;

  sheetData.push(['']); r++;
  sheetData.push(['']); r++;

  // Signature section with merged cells
  sheetData.push(['Mengetahui Kepala KUA,', '', '', signatureDateStr]);
  merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
  merges.push({ s: { r, c: 2 }, e: { r, c: 3 } });
  r++;

  sheetData.push([pejabatPenilai.jabatan, '', '', 'Pegawai,']);
  merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
  merges.push({ s: { r, c: 2 }, e: { r, c: 3 } });
  r++;

  sheetData.push(['']); r++;
  sheetData.push(['']); r++;
  sheetData.push(['']); r++;

  sheetData.push([pejabatPenilai.nama, '', '', user.nama]);
  merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
  merges.push({ s: { r, c: 2 }, e: { r, c: 3 } });
  r++;

  sheetData.push([`NIP. ${pejabatPenilai.nip}`, '', '', `NIP. ${user.nip}`]);
  merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
  merges.push({ s: { r, c: 2 }, e: { r, c: 3 } });
  r++;

  // Notes
  sheetData.push(['']); r++;
  sheetData.push(['Catatan:']); r++;
  merges.push({ s: { r: r - 1, c: 0 }, e: { r: r - 1, c: 3 } });
  sheetData.push(['Keterangan diisi dengan:']); r++;
  sheetData.push(['1. Nominal tunjangan kinerja yang diterima']); r++;
  sheetData.push(['2. Jumlah kehadiran']); r++;
  sheetData.push(['3. Nominal uang makan yang diterima']); r++;

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  worksheet['!cols'] = [
    { wch: 6 },   // NO (merged with B=35 in signature: 41wch)
    { wch: 35 },  // URAIAN
    { wch: 18 },  // ADA / TIDAK ADA (merged with D=30 in signature: 48wch)
    { wch: 30 }   // KETERANGAN
  ];
  worksheet['!merges'] = merges;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Tukin');

  XLSX.writeFile(workbook, `Rekap_Tukin_${user.nama.replace(/\s+/g, '_')}_${monthName}_${year}.xlsx`);
}
