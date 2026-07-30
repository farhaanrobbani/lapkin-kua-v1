import React from 'react';
import { User, PejabatPenilai } from '../../types/index';
import { formatRupiah, getNamaBulan } from '../../utils/formatters';

interface Props {
  user: User;
  month: number;
  year: number;
  pejabatPenilai: PejabatPenilai;
  totalHariKerja?: number;
  containerId?: string;
  customCetakDate?: string;
  kuaName?: string;
}

export const TemplateRekapTukin: React.FC<Props> = ({
  user,
  month,
  year,
  pejabatPenilai,
  totalHariKerja = 22,
  containerId = 'template-rekap-tukin',
  customCetakDate,
  kuaName
}) => {
  const monthName = getNamaBulan(month);
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const signatureDateStr = `${lastDayOfMonth} ${monthName} ${year}`;
  const displayCetakDate = `Malang, ${signatureDateStr}`;
  
  // Rate uang makan per hari = Rp 35.150
  const nominalUangMakan = totalHariKerja * 35150;

  return (
    <div
      id={containerId}
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      className="bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-lg border border-slate-300 text-xs max-w-4xl mx-auto space-y-6 font-['Arial',sans-serif]"
    >
      {/* Header Kop */}
      <div className="text-center border-b-2 border-slate-900 pb-4">
        <h2 className="text-xl font-bold tracking-wider uppercase">
          REKAP LAPORAN KINERJA BULAN {monthName.toUpperCase()} {year}
        </h2>
      </div>

      {/* Identitas: Nama, NIP, Jabatan, Instansi, Grade, Nilai Tukin & Foto tanpa judul */}
      <div className="flex items-start justify-between bg-slate-50/50 p-4 rounded-lg border border-slate-300">
        <div className="space-y-2 leading-relaxed text-xs flex-1 pr-4">
          <div className="flex">
            <span className="w-36 font-semibold text-slate-700">Nama</span>
            <span className="w-4 font-semibold">:</span>
            <span className="font-bold text-slate-900 text-sm">{user.nama}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-semibold text-slate-700">NIP</span>
            <span className="w-4 font-semibold">:</span>
            <span className="font-mono text-slate-900">{user.nip}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-semibold text-slate-700">Jabatan</span>
            <span className="w-4 font-semibold">:</span>
            <span className="font-medium text-slate-800">{user.jabatan}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-semibold text-slate-700">Instansi</span>
            <span className="w-4 font-semibold">:</span>
            <span className="font-medium text-slate-800">{kuaName || user.instansi}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-semibold text-slate-700">Grade Tukin</span>
            <span className="w-4 font-semibold">:</span>
            <span className="font-bold text-emerald-800">Grade {user.grade_tukin}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-semibold text-slate-700">Nilai Tukin (Bersih)</span>
            <span className="w-4 font-semibold">:</span>
            <span className="font-extrabold text-slate-900">{formatRupiah(user.jumlah_tukin_bersih)}</span>
          </div>
        </div>

        {/* Foto Profil tanpa judul */}
        <div className="flex flex-col items-center pl-4 border-l border-slate-300">
          <img
            src={user.foto_profil_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
            alt={user.nama}
            className="w-24 h-32 object-cover rounded border border-slate-800 shadow-sm"
          />
        </div>
      </div>

      {/* Tabel Spreadsheet Template 2 */}
      <div className="pt-1">
        <table className="w-full text-left border-collapse border border-slate-900 text-xs">
          <thead className="bg-slate-100 uppercase font-bold text-slate-900 text-center">
            <tr>
              <th className="border border-slate-900 p-2.5 w-12">NO</th>
              <th className="border border-slate-900 p-2.5">URAIAN</th>
              <th className="border border-slate-900 p-2.5 w-32">ADA / TIDAK ADA</th>
              <th className="border border-slate-900 p-2.5 w-52">KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-900 p-2.5 text-center font-bold">1</td>
              <td className="border border-slate-900 p-2.5 font-bold text-slate-900">
                Rekap Tunjangan Kinerja
              </td>
              <td className="border border-slate-900 p-2.5 text-center font-semibold text-emerald-800 bg-emerald-50/50">
                Ada
              </td>
              <td className="border border-slate-900 p-2.5 font-bold text-slate-900">
                {formatRupiah(user.jumlah_tukin_bersih)}
              </td>
            </tr>

            <tr>
              <td className="border border-slate-900 p-2.5 text-center font-bold">2</td>
              <td className="border border-slate-900 p-2.5 font-semibold text-slate-800">
                Rekap Kehadiran
              </td>
              <td className="border border-slate-900 p-2.5 text-center font-semibold text-emerald-800 bg-emerald-50/50">
                Ada
              </td>
              <td className="border border-slate-900 p-2.5 font-medium text-slate-800">
                {totalHariKerja} Hari
              </td>
            </tr>

            <tr>
              <td className="border border-slate-900 p-2.5 text-center font-bold">3</td>
              <td className="border border-slate-900 p-2.5 font-semibold text-slate-800">
                Rekap Uang Makan
              </td>
              <td className="border border-slate-900 p-2.5 text-center font-semibold text-emerald-800 bg-emerald-50/50">
                Ada
              </td>
              <td className="border border-slate-900 p-2.5 font-bold text-slate-800">
                {formatRupiah(nominalUangMakan)}
              </td>
            </tr>

            <tr>
              <td className="border border-slate-900 p-2.5 text-center font-bold">4</td>
              <td className="border border-slate-900 p-2.5 font-semibold text-slate-800">
                Laporan Kinerja
              </td>
              <td className="border border-slate-900 p-2.5 text-center font-semibold text-emerald-800 bg-emerald-50/50">
                Ada
              </td>
              <td className="border border-slate-900 p-2.5 font-medium text-slate-800">
                1 Laporan
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tanda tangan di bawah tabel */}
      <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-center">
        {/* Left: Kepala KUA */}
        <div className="space-y-1 flex flex-col items-center">
          <p className="font-semibold">Mengetahui Kepala KUA,</p>
          <p className="font-bold">{pejabatPenilai.jabatan}</p>

          <div className="h-20 my-2"></div>

          <p className="font-bold underline text-sm">{pejabatPenilai.nama}</p>
          <p className="text-[11px] text-slate-700">NIP. {pejabatPenilai.nip}</p>
        </div>

        {/* Right: Pegawai */}
        <div className="space-y-1 flex flex-col items-center">
          <p className="font-semibold">{displayCetakDate}</p>
          <p className="font-bold">Pegawai,</p>

          <div className="h-20 my-2"></div>

          <p className="font-bold underline text-sm">{user.nama}</p>
          <p className="text-[11px] text-slate-700">NIP. {user.nip}</p>
        </div>
      </div>

      {/* Catatan Keterangan Bawah */}
      <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-700 space-y-1 font-sans">
        <p className="font-bold text-slate-900">Catatan:</p>
        <p className="font-semibold">Keterangan diisi dengan:</p>
        <ol className="list-decimal pl-5 space-y-0.5">
          <li>Nominal tunjangan kinerja yang diterima</li>
          <li>Jumlah kehadiran</li>
          <li>Nominal uang makan yang diterima</li>
        </ol>
      </div>

    </div>
  );
};


