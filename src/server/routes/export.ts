import { jsPDF } from 'jspdf';
import { Router, Response } from 'express';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ImageRun
} from 'docx';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import https from 'https';
import http from 'http';

function urlFetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return urlFetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const buf = await urlFetchBuffer(url);
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
    const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
    const mime = mimeMap[ext] || 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch (e) {
    console.error('Image fetch error:', e);
    return null;
  }
}

const router = Router();
router.use(authMiddleware);

const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const TABLE_NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const SINGLE_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
};

const FONT = 'Arial';

function getNamaBulan(m: number): string {
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return bulan[m - 1] || 'Januari';
}

function formatTanggalIndo(dateString: string): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateString;
  }
}

function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

router.post('/word', async (req: AuthRequest, res: Response) => {
  try {
    const { user_id, month, year, template, customCetakDate, totalHariKerja: totalHariKerjaInput } = req.body;

    if (!user_id || !month || !year || !template) {
      return res.status(400).json({ error: 'user_id, month, year, dan template wajib diisi.' });
    }

    const user = await db.getUserById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    const pejabatPenilai = await db.getPejabatPenilai();
    const monthName = getNamaBulan(month);
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const totalHariKerja = totalHariKerjaInput || 22;

    if (template === 'template1') {
      const activities = await db.getStaffActivities(user_id, month, year);
      const defaultDateStr = `${lastDayOfMonth} ${monthName} ${year}`;

      let printDateStr = defaultDateStr;
      if (customCetakDate && customCetakDate.trim() !== '') {
        const parts = customCetakDate.split(',');
        printDateStr = parts.length > 1 ? parts[1].trim() : customCetakDate.trim();
      }

      const titleParagraph = new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: 'LAPORAN KINERJA', bold: true, size: 28, font: FONT })]
      });

      const metaRows = [
        ['Nama', user.nama],
        ['NIP', user.nip],
        ['Jabatan', user.jabatan],
        ['Pangkat', user.pangkat],
        ['Golongan / Ruang', user.ruang_golongan],
      ].map(([label, val]) => new TableRow({
        children: [
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: SINGLE_BORDER, children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: FONT, size: 20 })] })] }),
          new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, borders: SINGLE_BORDER, children: [new Paragraph({ children: [new TextRun({ text: val, font: FONT, size: 20 })] })] }),
        ]
      }));

      const userMetaTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: metaRows });

      const tanggalCetakParagraph = new Paragraph({
        spacing: { before: 200, after: 200 },
        children: [
          new TextRun({ text: 'Tanggal Dicetak : ', bold: true, font: FONT, size: 20 }),
          new TextRun({ text: printDateStr, font: FONT, size: 20 }),
        ]
      });

      const tableRows: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({ shading: { fill: 'F1F5F9' }, borders: SINGLE_BORDER, width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NO', bold: true, font: FONT, size: 20 })] })] }),
            new TableCell({ shading: { fill: 'F1F5F9' }, borders: SINGLE_BORDER, width: { size: 42, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'KEGIATAN', bold: true, font: FONT, size: 20 })] })] }),
            new TableCell({ shading: { fill: 'F1F5F9' }, borders: SINGLE_BORDER, width: { size: 32, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PEKERJAAN', bold: true, font: FONT, size: 20 })] })] }),
            new TableCell({ shading: { fill: 'F1F5F9' }, borders: SINGLE_BORDER, width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TANGGAL', bold: true, font: FONT, size: 20 })] })] }),
          ]
        })
      ];

      const map = new Map<string, typeof activities>();
      activities.forEach(act => {
        const list = map.get(act.tanggal) || [];
        list.push(act);
        map.set(act.tanggal, list);
      });

      const sortedDates = Array.from(map.keys()).sort();
      sortedDates.forEach((date, idx) => {
        const items = map.get(date) || [];
        const kegiatanChildren = items.map((it, i) =>
          new Paragraph({ children: [new TextRun({ text: items.length > 1 ? `${i + 1}. ${it.kegiatan}` : it.kegiatan, font: FONT, size: 20 })] })
        );
        const pekerjaanChildren = items.map((it, i) => {
          const pText = it.pekerjaan === '-' ? '-' : `${it.pekerjaan} (${it.total_jumlah})`;
          const displayText = items.length > 1 ? `${i + 1}. ${pText}` : pText;
          return new Paragraph({ children: [new TextRun({ text: displayText, font: FONT, size: 20 })] });
        });
        tableRows.push(new TableRow({
          children: [
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font: FONT, size: 20 })] })] }),
            new TableCell({ borders: SINGLE_BORDER, children: kegiatanChildren }),
            new TableCell({ borders: SINGLE_BORDER, children: pekerjaanChildren }),
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatTanggalIndo(date), font: FONT, size: 20 })] })] }),
          ]
        }));
      });

      const dataTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows });

      const signatureTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: TABLE_NO_BORDER,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE }, borders: NO_BORDER,
                children: [
                  new Paragraph({ children: [new TextRun({ text: 'Pejabat Penilai,', font: FONT, size: 20 })] }),
                  new Paragraph({
                    spacing: { before: 0, after: pejabatPenilai.opsi_anchor_ttd ? 900 : 1200 },
                    children: [new TextRun({ text: '', font: FONT, size: 1 })]
                  }),
                  ...(pejabatPenilai.opsi_anchor_ttd ? [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: pejabatPenilai.opsi_anchor_ttd, bold: true, font: FONT, size: 22 })] })] : []),
                  new Paragraph({ children: [new TextRun({ text: pejabatPenilai.nama, bold: true, underline: {}, font: FONT, size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: `NIP. ${pejabatPenilai.nip}`, font: FONT, size: 18 })] }),
                ]
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE }, borders: NO_BORDER,
                children: [
                  new Paragraph({ children: [new TextRun({ text: 'Pegawai yang Dinilai,', font: FONT, size: 20 })] }),
                  new Paragraph({
                    spacing: { before: 0, after: 1200 },
                    children: [new TextRun({ text: '', font: FONT, size: 1 })]
                  }),
                  new Paragraph({ children: [new TextRun({ text: user.nama, bold: true, underline: {}, font: FONT, size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: `NIP. ${user.nip}`, font: FONT, size: 18 })] }),
                ]
              }),
            ]
          })
        ]
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: [titleParagraph, userMetaTable, tanggalCetakParagraph, new Paragraph({ text: '\n' }), dataTable, new Paragraph({ text: '\n\n' }), signatureTable]
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      const filename = `Laporan_Kinerja_${user.nama.replace(/\s+/g, '_')}_${monthName}_${year}.docx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);

    } else if (template === 'template2') {
      const settings = await db.getSettings();
      const kuaInstansi = settings.kua_instansi || user.instansi || 'KUA Ampelgading';

      const signatureDateStr = customCetakDate || `Malang, ${lastDayOfMonth} ${monthName} ${year}`;
      const nominalUangMakan = totalHariKerja * 35150;

      const titleParagraph = new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: `REKAP LAPORAN KINERJA BULAN ${monthName.toUpperCase()} ${year}`, bold: true, size: 26, font: FONT })]
      });

      const metaRows = [
        ['Nama', user.nama],
        ['NIP', user.nip],
        ['Jabatan', user.jabatan],
        ['Instansi', kuaInstansi],
        ['Grade Tukin', `Grade ${user.grade_tukin}`],
        ['Nilai Tukin Kotor', formatRupiah(user.jumlah_tukin_kotor)],
      ].map(([label, val]) => new TableRow({
        children: [
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: NO_BORDER, children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: FONT, size: 20 })] })] }),
          new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, borders: NO_BORDER, children: [new Paragraph({ children: [new TextRun({ text: val, font: FONT, size: 20 })] })] }),
        ]
      }));

      const userMetaTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: metaRows });

      let headerTable = userMetaTable;
      if (user.foto_profil_url) {
        try {
          const imgBuf = await urlFetchBuffer(user.foto_profil_url);
          if (imgBuf && imgBuf.length > 100) {
            const photoParagraph = new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({ data: imgBuf, transformation: { width: 100, height: 133 } }),
              ]
            });
            headerTable = new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: TABLE_NO_BORDER,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ width: { size: 75, type: WidthType.PERCENTAGE }, borders: NO_BORDER, children: [userMetaTable] }),
                    new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, borders: NO_BORDER, children: [photoParagraph] }),
                  ]
                })
              ]
            });
          }
        } catch {}
      }

      const tableRows: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({ shading: { fill: 'F1F5F9' }, borders: SINGLE_BORDER, width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NO', bold: true, font: FONT, size: 20 })] })] }),
            new TableCell({ shading: { fill: 'F1F5F9' }, borders: SINGLE_BORDER, width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'URAIAN', bold: true, font: FONT, size: 20 })] })] }),
            new TableCell({ shading: { fill: 'F1F5F9' }, borders: SINGLE_BORDER, width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ADA / TIDAK ADA', bold: true, font: FONT, size: 20 })] })] }),
            new TableCell({ shading: { fill: 'F1F5F9' }, borders: SINGLE_BORDER, width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'KETERANGAN', bold: true, font: FONT, size: 20 })] })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '1', font: FONT, size: 20 })] })] }),
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ children: [new TextRun({ text: 'Rekap Tunjangan Kinerja', bold: true, font: FONT, size: 20 })] })] }),
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ada', font: FONT, size: 20 })] })] }),
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ children: [new TextRun({ text: formatRupiah(user.jumlah_tukin_kotor), bold: true, font: FONT, size: 20 })] })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '2', font: FONT, size: 20 })] })] }),
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ children: [new TextRun({ text: 'Rekap Kehadiran', font: FONT, size: 20 })] })] }),
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ada', font: FONT, size: 20 })] })] }),
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ children: [new TextRun({ text: `${totalHariKerja} Hari`, font: FONT, size: 20 })] })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '3', font: FONT, size: 20 })] })] }),
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ children: [new TextRun({ text: 'Rekap Uang Makan', font: FONT, size: 20 })] })] }),
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ada', font: FONT, size: 20 })] })] }),
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ children: [new TextRun({ text: formatRupiah(nominalUangMakan), bold: true, font: FONT, size: 20 })] })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '4', font: FONT, size: 20 })] })] }),
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ children: [new TextRun({ text: 'Laporan Kinerja', font: FONT, size: 20 })] })] }),
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ada', font: FONT, size: 20 })] })] }),
            new TableCell({ borders: SINGLE_BORDER, children: [new Paragraph({ children: [new TextRun({ text: '1 Laporan', font: FONT, size: 20 })] })] }),
          ]
        }),
      ];

      const dataTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows });

      const signatureTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: TABLE_NO_BORDER,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE }, borders: NO_BORDER,
                children: [
                  new Paragraph({ children: [new TextRun({ text: 'Mengetahui,', font: FONT, size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: pejabatPenilai.jabatan, font: FONT, size: 20 })] }),
                  new Paragraph({
                    spacing: { before: 0, after: pejabatPenilai.opsi_anchor_ttd ? 900 : 1200 },
                    children: [new TextRun({ text: '', font: FONT, size: 1 })]
                  }),
                  ...(pejabatPenilai.opsi_anchor_ttd ? [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: pejabatPenilai.opsi_anchor_ttd, bold: true, font: FONT, size: 22 })] })] : []),
                  new Paragraph({ children: [new TextRun({ text: pejabatPenilai.nama, bold: true, underline: {}, font: FONT, size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: `NIP. ${pejabatPenilai.nip}`, font: FONT, size: 18 })] }),
                ]
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE }, borders: NO_BORDER,
                children: [
                  new Paragraph({ children: [new TextRun({ text: signatureDateStr, font: FONT, size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'Pegawai,', font: FONT, size: 20 })] }),
                  new Paragraph({
                    spacing: { before: 0, after: 1200 },
                    children: [new TextRun({ text: '', font: FONT, size: 1 })]
                  }),
                  new Paragraph({ children: [new TextRun({ text: user.nama, bold: true, underline: {}, font: FONT, size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: `NIP. ${user.nip}`, font: FONT, size: 18 })] }),
                ]
              }),
            ]
          })
        ]
      });

      const notesParagraph = new Paragraph({
        spacing: { before: 200 },
        children: [
          new TextRun({ text: 'Catatan:\n', bold: true, font: FONT, size: 18 }),
          new TextRun({ text: 'Keterangan diisi dengan:\n', font: FONT, size: 18 }),
          new TextRun({ text: '1. Nominal tunjangan kinerja yang diterima\n', font: FONT, size: 18 }),
          new TextRun({ text: '2. Jumlah kehadiran\n', font: FONT, size: 18 }),
          new TextRun({ text: '3. Nominal uang makan yang diterima', font: FONT, size: 18 }),
        ]
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: [titleParagraph, headerTable, new Paragraph({ text: '\n' }), dataTable, new Paragraph({ text: '\n\n' }), signatureTable, notesParagraph]
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      const filename = `Rekap_Tukin_${user.nama.replace(/\s+/g, '_')}_${monthName}_${year}.docx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);

    } else {
      return res.status(400).json({ error: 'Template harus template1 atau template2.' });
    }
  } catch (err) {
    console.error('Export Word error:', err);
    return res.status(500).json({ error: 'Gagal membuat dokumen Word.' });
  }
});

const PDF_LH = 5; // line height in mm for font size 10

// ─── PDF Export ──────────────────────────────────────────────────────────────

const PDF_COLS_T1 = [14, 62, 56, 38]; // NO, KEGIATAN, PEKERJAAN, TANGGAL
const PDF_COLS_T2 = [16, 62, 36, 56]; // NO, URAIAN, ADA/TIDAK, KETERANGAN

function pdfDrawTable(
  doc: jsPDF, headers: string[], body: string[][],
  startY: number, colWidths: number[], margin: number, fontSize: number
): number {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pad = 1.5;
  const lineH = fontSize * 0.45;
  const bottom = margin;
  const headerBg: [number, number, number] = [241, 245, 249];

  function cellTextLines(text: string, w: number): string[] {
    return doc.splitTextToSize(String(text || ''), w - 2 * pad);
  }

  function cellHeight(texts: string[][]): number {
    let max = 1;
    texts.forEach(t => { if (t.length > max) max = t.length; });
    return max * lineH + 2 * pad;
  }

  function drawCells(cells: string[], x: number, y: number, h: number, fill?: [number, number, number]) {
    cells.forEach((text, i) => {
      const w = colWidths[i];
      if (fill) { doc.setFillColor(...fill); doc.rect(x, y, w, h, 'F'); }
      doc.setDrawColor(0);
      doc.rect(x, y, w, h, 'S');
      doc.setFontSize(fontSize);
      doc.setTextColor(0);
      const lines = doc.splitTextToSize(text, w - 2 * pad);
      lines.forEach((line, li) => doc.text(line, x + pad, y + pad + (li + 1) * lineH * 0.7));
      x += w;
    });
  }

  let y = startY;
  const headerTexts = headers.map((h, i) => cellTextLines(h, colWidths[i]));
  let hdrH = cellHeight(headerTexts);
  if (y + hdrH > pageH - bottom) { doc.addPage(); y = margin; }
  drawCells(headers, margin, y, hdrH, headerBg);
  y += hdrH;

  body.forEach((row) => {
    const texts = row.map((c, i) => cellTextLines(c, colWidths[i]));
    const rowH = cellHeight(texts);
    if (y + rowH > pageH - bottom) {
      doc.addPage();
      y = margin;
      drawCells(headers, margin, y, hdrH, headerBg);
      y += hdrH;
    }
    drawCells(row, margin, y, rowH);
    y += rowH;
  });

  return y;
}

// ─── PDF Meta Table helper (bordered label:value table) ───────────────

function pdfDrawMetaTable(
  doc: jsPDF, rows: [string, string][],
  startY: number, labelW: number, valueW: number, margin: number, fontSize: number
): number {
  const pageH = doc.internal.pageSize.getHeight();
  const pad = 1.5;
  const lineH = fontSize * 0.45;
  const bottom = margin;
  let y = startY;

  rows.forEach(([label, val]) => {
    const labelLines = doc.splitTextToSize(label, labelW - 2 * pad);
    const valLines = doc.splitTextToSize(val, valueW - 2 * pad);
    const maxLines = Math.max(labelLines.length, valLines.length);
    const rowH = maxLines * lineH + 2 * pad;

    if (y + rowH > pageH - bottom) { doc.addPage(); y = margin; }

    doc.setDrawColor(0);
    doc.setFontSize(fontSize);

    doc.rect(margin, y, labelW, rowH, 'S');
    doc.setFont('Helvetica', 'bold');
    labelLines.forEach((line, li) => doc.text(line, margin + pad, y + pad + (li + 1) * lineH * 0.7));

    doc.rect(margin + labelW, y, valueW, rowH, 'S');
    doc.setFont('Helvetica', 'normal');
    valLines.forEach((line, li) => doc.text(line, margin + labelW + pad, y + pad + (li + 1) * lineH * 0.7));

    y += rowH;
  });

  return y;
}

router.post('/pdf', async (req: AuthRequest, res: Response) => {
  try {
    const { user_id, month, year, template, customCetakDate, totalHariKerja: totalHariKerjaInput } = req.body;

    if (!user_id || !month || !year || !template) {
      return res.status(400).json({ error: 'user_id, month, year, dan template wajib diisi.' });
    }

    const user = await db.getUserById(user_id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });

    const pejabatPenilai = await db.getPejabatPenilai();
    const monthName = getNamaBulan(month);
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const totalHariKerja = totalHariKerjaInput || 22;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pgW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentW = pgW - 2 * margin;
    const defaultDateStr = `${lastDayOfMonth} ${monthName} ${year}`;

    if (template === 'template1') {
      const activities = await db.getStaffActivities(user_id, month, year);

      let printDateStr = defaultDateStr;
      if (customCetakDate && customCetakDate.trim() !== '') {
        const parts = customCetakDate.split(',');
        printDateStr = parts.length > 1 ? parts[1].trim() : customCetakDate.trim();
      }

      // Title
      doc.setFontSize(16);
      doc.setFont('Helvetica', 'bold');
      doc.text('LAPORAN KINERJA', pgW / 2, margin, { align: 'center' });

      // Metadata bordered table
      let y = margin + 12;
      doc.setFontSize(10);
      const metaRows: [string, string][] = [
        ['Nama', user.nama], ['NIP', user.nip], ['Jabatan', user.jabatan],
        ['Pangkat', user.pangkat], ['Golongan / Ruang', user.ruang_golongan],
      ];
      y = pdfDrawMetaTable(doc, metaRows, y, 38, contentW - 38, margin, 10);

      // Tanggal Dicetak
      y += 5;
      doc.setFont('Helvetica', 'bold');
      doc.text('Tanggal Dicetak : ', margin, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(printDateStr, margin + 36, y);
      y += 6;

      // Data Table
      const headers = ['NO', 'KEGIATAN', 'PEKERJAAN', 'TANGGAL'];

      const map = new Map<string, typeof activities>();
      activities.forEach(act => { const l = map.get(act.tanggal) || []; l.push(act); map.set(act.tanggal, l); });
      const sortedDates = Array.from(map.keys()).sort();
      const body: string[][] = [];
      sortedDates.forEach((date, idx) => {
        const items = map.get(date) || [];
        const kegiatanStr = items.length === 1 ? items[0].kegiatan : items.map((it, i) => `${i + 1}. ${it.kegiatan}`).join('\n');
        const pfmt = (it: { pekerjaan: string; total_jumlah: number }) => it.pekerjaan === '-' ? '-' : `${it.pekerjaan} (${it.total_jumlah})`;
        const pekerjaanStr = items.length === 1 ? pfmt(items[0]) : items.map((it, i) => `${i + 1}. ${pfmt(it)}`).join('\n');
        body.push([String(idx + 1), kegiatanStr, pekerjaanStr, formatTanggalIndo(date)]);
      });

      y = pdfDrawTable(doc, headers, body, y, PDF_COLS_T1, margin, 10);
      y += 10;

      // Signature - no date, no jabatan, labels aligned
      const sigW = contentW / 2;
      const sigBase = y;
      doc.setFontSize(10);

      let sx = margin;
      doc.setFont('Helvetica', 'normal');
      doc.text('Pejabat Penilai,', sx, sigBase);
      const t1NamaY = sigBase + 22;
      if (pejabatPenilai.opsi_anchor_ttd) {
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'bold');
        doc.text(pejabatPenilai.opsi_anchor_ttd, sx, t1NamaY - 9);
      }
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text(pejabatPenilai.nama, sx, t1NamaY);
      doc.text('NIP. ' + pejabatPenilai.nip, sx, t1NamaY + PDF_LH);

      const rx = margin + sigW;
      doc.setFont('Helvetica', 'normal');
      doc.text('Pegawai yang Dinilai,', rx, sigBase);
      doc.setFont('Helvetica', 'bold');
      doc.text(user.nama, rx, sigBase + 22);
      doc.text('NIP. ' + user.nip, rx, sigBase + 22 + PDF_LH);

      const buf = Buffer.from(doc.output('arraybuffer'));
      const filename = `Laporan_Kinerja_${user.nama.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buf);

    } else if (template === 'template2') {
      const settings = await db.getSettings();
      const kuaInstansi = settings.kua_instansi || user.instansi || 'KUA Ampelgading';

      const signatureDateStr = customCetakDate || `Malang, ${lastDayOfMonth} ${monthName} ${year}`;
      const nominalUangMakan = totalHariKerja * 35150;

      // Title
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text(`REKAP LAPORAN KINERJA BULAN ${monthName.toUpperCase()} ${year}`, pgW / 2, margin, { align: 'center' });

      // Metadata (plain text) with photo
      let y = margin + 14;
      doc.setFontSize(10);

      const meta: [string, string][] = [
        ['Nama', user.nama], ['NIP', user.nip], ['Jabatan', user.jabatan],
        ['Instansi', kuaInstansi], ['Grade Tukin', `Grade ${user.grade_tukin}`],
        ['Nilai Tukin Kotor', formatRupiah(user.jumlah_tukin_kotor)],
      ];
      const labelW = 42;
      const photoW = 28;
      const photoGap = 4;
      const metaStartY = y;
      meta.forEach(([label, val]) => {
        doc.setFont('Helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('Helvetica', 'normal');
        doc.text(': ' + val, margin + labelW, y);
        y += 5.5;
      });
      if (user.foto_profil_url) {
        try {
          const imgData = await fetchImageAsBase64(user.foto_profil_url);
          if (imgData) {
            const photoX = margin + contentW - photoW;
            const photoH = photoW * 1.35;
            doc.addImage(imgData, photoX, metaStartY + 1, photoW, photoH);
          }
        } catch {}
      }
      y += 3;

      // Data Table
      const headers = ['NO', 'URAIAN', 'ADA / TIDAK ADA', 'KETERANGAN'];
      const body: string[][] = [
        ['1', 'Rekap Tunjangan Kinerja', 'Ada', formatRupiah(user.jumlah_tukin_kotor)],
        ['2', 'Rekap Kehadiran', 'Ada', `${totalHariKerja} Hari`],
        ['3', 'Rekap Uang Makan', 'Ada', formatRupiah(nominalUangMakan)],
        ['4', 'Laporan Kinerja', 'Ada', '1 Laporan'],
      ];

      y = pdfDrawTable(doc, headers, body, y, PDF_COLS_T2, margin, 10);
      y += 10;

      // Signature - same style as template1, with "Mengetahui" and city+date
      const sigW = contentW / 2;
      const sigBase = y;
      doc.setFontSize(10);

      const leftGapBase = PDF_LH; // jabatan line offset
      let sx = margin;
      doc.setFont('Helvetica', 'normal');
      doc.text('Mengetahui,', sx, sigBase);
      doc.setFont('Helvetica', 'normal');
      doc.text(pejabatPenilai.jabatan, sx, sigBase + leftGapBase);
      const t2NamaY = sigBase + leftGapBase + 22;
      if (pejabatPenilai.opsi_anchor_ttd) {
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'bold');
        doc.text(pejabatPenilai.opsi_anchor_ttd, sx, t2NamaY - 9);
      }
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text(pejabatPenilai.nama, sx, t2NamaY);
      doc.text('NIP. ' + pejabatPenilai.nip, sx, t2NamaY + PDF_LH);

      const rx = margin + sigW;
      doc.setFont('Helvetica', 'normal');
      doc.text(signatureDateStr, rx, sigBase);
      doc.text('Pegawai,', rx, sigBase + leftGapBase);
      doc.setFont('Helvetica', 'bold');
      doc.text(user.nama, rx, sigBase + leftGapBase + 22);
      doc.text('NIP. ' + user.nip, rx, sigBase + leftGapBase + 22 + PDF_LH);

      const buf = Buffer.from(doc.output('arraybuffer'));
      const filename = `Rekap_Tukin_${user.nama.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buf);

    } else {
      return res.status(400).json({ error: 'Template harus template1 atau template2.' });
    }
  } catch (err) {
    console.error('Export PDF error:', err);
    return res.status(500).json({ error: 'Gagal membuat dokumen PDF.' });
  }
});

export default router;
