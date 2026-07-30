import React, { useMemo } from 'react';
import { User, StaffActivity, PejabatPenilai } from '../../types/index';
import { formatTanggalIndo, getNamaBulan } from '../../utils/formatters';

interface Props {
  user: User;
  month: number;
  year: number;
  activities: StaffActivity[];
  pejabatPenilai: PejabatPenilai;
  containerId?: string;
  customCetakDate?: string;
}

export const TemplateLaporanKinerja: React.FC<Props> = ({
  user,
  month,
  year,
  activities,
  pejabatPenilai,
  containerId = 'template-laporan-kinerja',
  customCetakDate
}) => {
  const monthName = getNamaBulan(month);
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const defaultSignatureDateStr = `${lastDayOfMonth} ${monthName} ${year}`;
  
  // Template 1: Tanggal cetak tanpa tempat, hanya tanggal!
  let displayCetakDate = defaultSignatureDateStr;
  if (customCetakDate && customCetakDate.trim() !== '') {
    // If user provided custom string containing location e.g. "Ampelgading, 31 Juli 2026", strip location before comma
    const parts = customCetakDate.split(',');
    displayCetakDate = parts.length > 1 ? parts[1].trim() : customCetakDate.trim();
  }

  // Group activities by date so 1 date = 1 row
  const groupedActivities = useMemo(() => {
    const map = new Map<string, StaffActivity[]>();
    activities.forEach(act => {
      const list = map.get(act.tanggal) || [];
      list.push(act);
      map.set(act.tanggal, list);
    });

    const sortedDates = Array.from(map.keys()).sort();
    return sortedDates.map(date => ({
      tanggal: date,
      items: map.get(date) || []
    }));
  }, [activities]);

  return (
    <div
      id={containerId}
      style={{ fontFamily: 'Arial, sans-serif' }}
      className="bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-lg border border-slate-300 text-xs max-w-4xl mx-auto space-y-6"
    >
      {/* Header Title */}
      <div className="text-center border-b-2 border-slate-900 pb-4">
        <h2 className="text-xl font-bold tracking-wider uppercase">
          LAPORAN KINERJA
        </h2>
      </div>

      {/* Identitas Pegawai: Nama, NIP, Jabatan, Pangkat, Golongan/Ruang & Tanggal Dicetak */}
      <div className="space-y-2 font-sans text-xs leading-relaxed pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 font-semibold">Nama</span>
              <span className="w-4">:</span>
              <span className="font-bold">{user.nama}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">NIP</span>
              <span className="w-4">:</span>
              <span>{user.nip}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Jabatan</span>
              <span className="w-4">:</span>
              <span>{user.jabatan}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 font-semibold">Pangkat</span>
              <span className="w-4">:</span>
              <span>{user.pangkat}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Golongan / Ruang</span>
              <span className="w-4">:</span>
              <span>{user.ruang_golongan}</span>
            </div>
          </div>
        </div>

        {/* Tanggal Dicetak Di Bawah Identitas */}
        <div className="flex pt-2 border-t border-slate-200 text-slate-700">
          <span className="w-32 font-semibold">Tanggal Dicetak</span>
          <span className="w-4">:</span>
          <span className="font-medium">{displayCetakDate}</span>
        </div>
      </div>

      {/* Main Table: Kolom 1: NO, Kolom 2: KEGIATAN, Kolom 3: PEKERJAAN, Kolom 4: TANGGAL */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs border-collapse border border-slate-900 font-sans">
          <thead className="bg-slate-100 uppercase font-bold text-slate-900 text-center">
            <tr>
              <th className="border border-slate-900 p-2.5 w-12">NO</th>
              <th className="border border-slate-900 p-2.5 w-2/5">KEGIATAN</th>
              <th className="border border-slate-900 p-2.5">PEKERJAAN</th>
              <th className="border border-slate-900 p-2.5 w-32">TANGGAL</th>
            </tr>
          </thead>
          <tbody>
            {groupedActivities.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-slate-900 p-6 text-center italic text-slate-500">
                  Tidak ada catatan kegiatan untuk bulan ini.
                </td>
              </tr>
            ) : (
              groupedActivities.map((group, index) => (
                <tr key={group.tanggal || index} className="even:bg-slate-50/50 align-top">
                  <td className="border border-slate-900 p-2 text-center font-semibold">{index + 1}</td>
                  
                  {/* Kolom Kegiatan (Daftar kegiatan pada tanggal tersebut) */}
                  <td className="border border-slate-900 p-2">
                    {group.items.length === 1 ? (
                      <div className="font-medium">{group.items[0].kegiatan}</div>
                    ) : (
                      <ol className="list-decimal pl-4 space-y-1 font-medium">
                        {group.items.map((item, idx) => (
                          <li key={idx}>{item.kegiatan}</li>
                        ))}
                      </ol>
                    )}
                  </td>

                  {/* Kolom Pekerjaan (Pekerjaan beserta jumlahnya) */}
                  <td className="border border-slate-900 p-2">
                    {group.items.length === 1 ? (
                      <div>
                        {group.items[0].activity_type_key === 'libur' || group.items[0].pekerjaan === '-' ? (
                          '-'
                        ) : (
                          <>
                            {group.items[0].pekerjaan}{' '}
                            <span className="font-semibold text-slate-700">
                              ({group.items[0].total_jumlah || 0})
                            </span>
                          </>
                        )}
                      </div>
                    ) : (
                      <ol className="list-decimal pl-4 space-y-1">
                        {group.items.map((item, idx) => (
                          <li key={idx}>
                            {item.activity_type_key === 'libur' || item.pekerjaan === '-' ? (
                              '-'
                            ) : (
                              <>
                                {item.pekerjaan}{' '}
                                <span className="font-semibold text-slate-700">
                                  ({item.total_jumlah || 0})
                                </span>
                              </>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </td>

                  {/* Kolom Tanggal (1 baris 1 tanggal) */}
                  <td className="border border-slate-900 p-2 text-center whitespace-nowrap font-medium">
                    {formatTanggalIndo(group.tanggal)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tanda tangan di bawah tabel */}
      <div className="pt-8 grid grid-cols-2 gap-8 text-xs font-sans text-center">
        {/* Left: Pejabat Penilai */}
        <div className="space-y-1 flex flex-col items-center">
          <p className="font-semibold">Pejabat Penilai,</p>
          <p className="font-bold">{pejabatPenilai.jabatan}</p>
          
          <div className="h-20 my-2"></div>

          <p className="font-bold underline text-sm">{pejabatPenilai.nama}</p>
          <p className="text-[11px] text-slate-700">NIP. {pejabatPenilai.nip}</p>
        </div>

        {/* Right: Pegawai yang Dinilai */}
        <div className="space-y-1 flex flex-col items-center">
          <p className="font-semibold">{displayCetakDate}</p>
          <p className="font-bold">Pegawai yang Dinilai,</p>

          <div className="h-20 my-2"></div>

          <p className="font-bold underline text-sm">{user.nama}</p>
          <p className="text-[11px] text-slate-700">NIP. {user.nip}</p>
        </div>
      </div>
    </div>
  );
};



