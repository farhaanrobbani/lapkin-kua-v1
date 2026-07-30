import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7890123456:AAFx_DummyTelegramBotTokenForKUA';

export async function sendTelegramMessage(chatId: string | number, htmlText: string, replyMarkup?: any, retries = 3): Promise<boolean> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: htmlText, parse_mode: 'HTML', reply_markup: replyMarkup })
      });

      if (response.ok) {
        await db.addTelegramLog({ command: 'notification', chat_id: String(chatId), user_name: 'Bot System', message: htmlText, status: 'sent' });
        return true;
      }
    } catch (err) {
      console.error(`Telegram send attempt ${attempt} failed:`, err);
    }
    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
  }

  await db.addTelegramLog({ command: 'notification', chat_id: String(chatId), user_name: 'Bot System', message: htmlText, status: 'failed' });
  return false;
}

router.post('/webhook', async (req: Request, res: Response) => {
  const update = req.body;

  if (update && update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();
    const userName = msg.from ? `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() : 'User';

    const todayStr = new Date().toISOString().split('T')[0];

    let replyText = '';
    let inlineKeyboard: any = null;

    if (text.startsWith('/start')) {
      replyText = `<b>Selamat Datang di Bot Laporan Kinerja KUA Ampelgading</b> \u{1F3DB}\u{FE0F}\n\nBot ini membantu Anda memantau data harian KUA, log kinerja staf, dokumen, dan rekapitulasi.\n\n<b>Perintah yang tersedia:</b>\n/today - Rekap Laporan KUA Hari Ini\n/upcoming - Jadwal Nikah & Kegiatan Mendatang\n/kendaraan - Status Operasional Kendaraan Dinas\n/dokumen - Status Kelengkapan Dokumen & Laporan\n/pembayaran - Rekapitulasi Tukin & Uang Makan Staf`;
      inlineKeyboard = { inline_keyboard: [[{ text: '\u{1F4CA} Laporan Hari Ini', callback_data: '/today' }, { text: '\u{1F4C5} Jadwal Mendatang', callback_data: '/upcoming' }], [{ text: '\u{1F4D1} Status Dokumen', callback_data: '/dokumen' }, { text: '\u{1F4B0} Rekap Tukin', callback_data: '/pembayaran' }]] };
    } else if (text.startsWith('/today')) {
      const todayData = await db.getKuaDailyByDate(todayStr);
      if (todayData) {
        replyText = `<b>\u{1F4CA} LAPORAN DAILY KUA - ${todayStr}</b>\n\n\u2022 Pendaftaran Nikah Kantor: <b>${todayData.pendaftaran_nikah_kantor}</b>\n\u2022 Pendaftaran Nikah Luar Kantor: <b>${todayData.pendaftaran_nikah_luar_kantor}</b>\n\u2022 Pelaksanaan Nikah Kantor: <b>${todayData.pelaksanaan_nikah_kantor}</b>\n\u2022 Pelaksanaan Nikah Luar Kantor: <b>${todayData.pelaksanaan_nikah_luar_kantor}</b>\n\u2022 Bimbingan Perkawinan (Bimwin): <b>${todayData.pelaksanaan_bimwin} pasang</b>\n\u2022 Duplikat Buku Nikah: <b>${todayData.duplikat_buku_nikah}</b>\n\u2022 Surat Rekomendasi Nikah: <b>${todayData.surat_rekomendasi_nikah}</b>\n\u2022 Legalisir Buku Nikah: <b>${todayData.legalisir_buku_nikah}</b>\n\u2022 Surat Keluar: <b>${todayData.surat_keluar}</b>\n\u2022 Akta Wakaf: <b>${todayData.pelaksanaan_wakaf}</b>`;
      } else {
        replyText = `<b>\u{1F4CA} LAPORAN DAILY KUA - ${todayStr}</b>\n\n<i>Belum ada input data harian dari Admin KUA untuk tanggal hari ini.</i>`;
      }
    } else if (text.startsWith('/upcoming')) {
      replyText = `<b>\u{1F4C5} JADWAL PERISTIWA NIKAH & KEGIATAN MENDATANG</b>\n\n1. <b>Akad Nikah Luar Kantor</b> - Desa Ampelgading (10:00 WIB)\n2. <b>Bimbingan Perkawinan Remaja</b> - Aula KUA (13:00 WIB)\n3. <b>Pemeriksaan Calon Pengantin</b> - R. Penghulu (14:30 WIB)`;
    } else if (text.startsWith('/kendaraan')) {
      replyText = `<b>\u{1F697} STATUS KENDARAAN OPERASIONAL KUA</b>\n\n1. <b>Sepeda Motor Honda Supri X (N 4120 XX)</b> - Siap Pakai (Operasional Bedol)\n2. <b>Sepeda Motor Yamaha Vixion (N 3211 YY)</b> - Siap Pakai\n<i>Status Servis Rutin: Lengkap & Terjadwal</i>`;
    } else if (text.startsWith('/dokumen')) {
      replyText = `<b>\u{1F4D1} STATUS KELENGKAPAN DOKUMEN & LAPORAN</b>\n\n\u2022 Laporan Kinerja Bulanan Juli 2026: <b>100% Terverifikasi</b>\n\u2022 Berkas Akta Nikah Terjadwal: <b>Sesuai Prosedur</b>\n\u2022 Legalisir & Rekomendasi: <b>Lancar</b>`;
    } else if (text.startsWith('/pembayaran')) {
      replyText = `<b>\u{1F4B0} REKAPITULASI TUNJANGAN KINERJA (TUKIN)</b>\n\n\u2022 Tukin Kotor Grade 8: <b>Rp 4.595.000</b>\n\u2022 Potongan PPh/Absensi: <b>Rp 229.750</b>\n\u2022 Tukin Bersih: <b>Rp 4.365.250</b>\n\u2022 Uang Makan: <b>Rp 726.000 (22 Hari)</b>\n<i>Status Pembayaran: Terverifikasi oleh Pengelola Laporan & KPA</i>`;
    } else {
      replyText = `Perintah <b>${text}</b> tidak dikenali. Ketik /start untuk melihat opsi perintah.`;
    }

    await db.addTelegramLog({ command: text, chat_id: String(chatId), user_name: userName, message: replyText, status: 'received' });
    await sendTelegramMessage(chatId, replyText, inlineKeyboard);
  }

  return res.json({ status: 'ok' });
});

router.get('/logs', asyncHandler(async (req: Request, res: Response) => {
  const logs = await db.getTelegramLogs();
  return res.json({ logs });
}));

router.post('/simulate', async (req: Request, res: Response) => {
  const { command, chatId } = req.body;
  const targetChatId = chatId || '123456789';

  const mockReq = { body: { message: { chat: { id: targetChatId }, text: command, from: { first_name: 'Simulasi', last_name: 'Staf' } } } };
  const update = mockReq.body;
  const text = update.message.text;
  let responseMsg = '';

  if (text.startsWith('/today')) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayData = await db.getKuaDailyByDate(todayStr);
    if (todayData) {
      responseMsg = `Laporan KUA Hari Ini (${todayStr}): Pendaftaran Kantor: ${todayData.pendaftaran_nikah_kantor}, Pendaftaran Luar: ${todayData.pendaftaran_nikah_luar_kantor}, Akad Luar: ${todayData.pelaksanaan_nikah_luar_kantor}`;
    } else {
      responseMsg = `Laporan KUA Hari Ini (${todayStr}): Belum ada input harian.`;
    }
  } else if (text.startsWith('/upcoming')) {
    responseMsg = `Jadwal Mendatang: Akad Bedol 10:00 WIB, Bimwin 13:00 WIB.`;
  } else if (text.startsWith('/kendaraan')) {
    responseMsg = `Kendaraan Dinas: 2 Sepeda Motor Operasional Siap Pakai.`;
  } else if (text.startsWith('/dokumen')) {
    responseMsg = `Status Dokumen: Laporan Kinerja Bulanan 100% Terisi.`;
  } else if (text.startsWith('/pembayaran')) {
    responseMsg = `Rekap Tukin: Tukin Bersih Rp 4.365.250 (Grade 8), Uang Makan Rp 726.000.`;
  } else {
    responseMsg = `Bot KUA Ampelgading siap melayani perintah /start, /today, /upcoming, /kendaraan, /dokumen, /pembayaran.`;
  }

  await db.addTelegramLog({ command, chat_id: String(targetChatId), user_name: 'Pengguna Simulasi Web', message: responseMsg, status: 'sent' });
  return res.json({ message: 'Command simulated successfully', responseMsg });
});

export default router;
