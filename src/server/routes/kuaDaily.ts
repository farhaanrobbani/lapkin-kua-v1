import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const data = await db.getKuaDailyData(month, year);
    return res.json({ data });
  } catch (err) {
    console.error('Get kua daily error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.get('/by-date', async (req: AuthRequest, res: Response) => {
  try {
    const { tanggal } = req.query;
    if (!tanggal || typeof tanggal !== 'string') {
      return res.status(400).json({ error: 'Parameter tanggal YYYY-MM-DD diperlukan.' });
    }
    const data = await db.getKuaDailyByDate(tanggal);
    return res.json({ data: data || null });
  } catch (err) {
    console.error('Get kua daily by date error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id, tanggal, ...rest } = req.body;

    if (!tanggal) {
      return res.status(400).json({ error: 'Tanggal wajib diisi.' });
    }

    const payload: Record<string, any> = {
      id,
      tanggal,
      created_by: req.user!.id
    };

    for (const [key, val] of Object.entries(rest)) {
      if (key !== 'created_by' && key !== 'created_at' && key !== 'updated_at') {
        payload[key] = typeof val === 'number' ? val : (Number(val) || 0);
      }
    }

    const saved = await db.upsertKuaDailyData(payload);
    return res.status(200).json({ data: saved });
  } catch (err) {
    console.error('Upsert kua daily error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteKuaDailyData(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Data Harian KUA tidak ditemukan.' });
    }
    return res.json({ message: 'Data Harian KUA berhasil dihapus.' });
  } catch (err) {
    console.error('Delete kua daily error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
