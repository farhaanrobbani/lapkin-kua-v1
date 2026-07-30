import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Protect with auth
router.use(authMiddleware);

// GET /api/kua-daily
router.get('/', (req: AuthRequest, res: Response) => {
  const month = req.query.month ? Number(req.query.month) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;
  const data = db.getKuaDailyData(month, year);
  return res.json({ data });
});

// GET /api/kua-daily/by-date?tanggal=YYYY-MM-DD
router.get('/by-date', (req: AuthRequest, res: Response) => {
  const { tanggal } = req.query;
  if (!tanggal || typeof tanggal !== 'string') {
    return res.status(400).json({ error: 'Parameter tanggal YYYY-MM-DD diperlukan.' });
  }
  const data = db.getKuaDailyByDate(tanggal);
  return res.json({ data: data || null });
});

// POST /api/kua-daily (Admin only)
router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  const { id, tanggal, ...rest } = req.body;

  if (!tanggal) {
    return res.status(400).json({ error: 'Tanggal wajib diisi.' });
  }

  const payload: Record<string, any> = {
    id,
    tanggal,
    created_by: req.user!.id
  };

  // Dynamically assign all key-value pairs (numerical values converted to numbers)
  for (const [key, val] of Object.entries(rest)) {
    if (key !== 'created_by' && key !== 'created_at' && key !== 'updated_at') {
      payload[key] = typeof val === 'number' ? val : (Number(val) || 0);
    }
  }

  const saved = db.upsertKuaDailyData(payload as any);

  return res.status(200).json({ data: saved });
});

// DELETE /api/kua-daily/:id (Admin only)
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteKuaDailyData(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Data Harian KUA tidak ditemukan.' });
  }
  return res.json({ message: 'Data Harian KUA berhasil dihapus.' });
});

export default router;
