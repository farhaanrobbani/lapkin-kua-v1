import { StaffActivity, User, PejabatPenilai } from '../types/index';

async function downloadFromApi(url: string, body: object) {
  try {
    const token = localStorage.getItem('kua_auth_token');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal mengekspor' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : 'dokumen.docx';

    const blob = await res.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlBlob;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(urlBlob);
  } catch (err) {
    console.error('Export Word error:', err);
    throw err;
  }
}

export function exportLaporanKinerjaWord(
  user: User,
  month: number,
  year: number,
  activities: StaffActivity[],
  pejabatPenilai: PejabatPenilai,
  customCetakDate?: string
) {
  return downloadFromApi('/api/export/word', {
    user_id: user.id,
    month,
    year,
    template: 'template1',
    customCetakDate: customCetakDate || ''
  });
}

export function exportRekapTukinWord(
  user: User,
  month: number,
  year: number,
  pejabatPenilai: PejabatPenilai,
  totalHariKerja: number = 22,
  customCetakDate?: string
) {
  return downloadFromApi('/api/export/word', {
    user_id: user.id,
    month,
    year,
    template: 'template2',
    totalHariKerja,
    customCetakDate: customCetakDate || ''
  });
}
