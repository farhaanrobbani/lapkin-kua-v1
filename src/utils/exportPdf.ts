async function downloadFromApi(url: string, body: object) {
  const token = localStorage.getItem('kua_auth_token');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Gagal mengekspor' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : 'dokumen.pdf';

  const blob = await res.blob();
  const urlBlob = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = urlBlob;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(urlBlob);
}

export async function exportElementToPdf(_elementId: string, _filename: string) {
  window.print();
}

export async function exportLaporanKinerjaPdf(
  userId: string, month: number, year: number,
  customCetakDate?: string
) {
  return downloadFromApi('/api/export/pdf', {
    user_id: userId, month, year, template: 'template1',
    customCetakDate: customCetakDate || ''
  });
}

export async function exportRekapTukinPdf(
  userId: string, month: number, year: number,
  totalHariKerja: number = 22, customCetakDate?: string
) {
  return downloadFromApi('/api/export/pdf', {
    user_id: userId, month, year, template: 'template2',
    totalHariKerja, customCetakDate: customCetakDate || ''
  });
}
