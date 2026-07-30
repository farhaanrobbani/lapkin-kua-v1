import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await db.getSettings();
    return res.json({ settings });
  } catch (err) {
    console.error('Get settings error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.put('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    const keys = Object.keys(updates);
    for (const key of keys) {
      if (typeof updates[key] === 'string') {
        await db.updateSetting(key, updates[key]);
      }
    }
    const settings = await db.getSettings();
    return res.json({ settings, message: 'Pengaturan berhasil disimpan.' });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
