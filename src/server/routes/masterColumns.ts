import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

interface MasterColumn {
  id: string;
  key: string;
  label: string;
  shortLabel: string;
}

router.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await db.getSettings();
    const raw = settings['kua_master_columns'];
    let columns: MasterColumn[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          columns = parsed.filter(
            (c: any) => c && typeof c.key === 'string' && c.key.trim() && typeof c.label === 'string' && c.label.trim()
          );
        }
      } catch {
        // fallback ke kolom default
      }
    }
    return res.json({ columns });
  } catch (err) {
    console.error('Get master columns error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.put('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { columns } = req.body;
    if (!Array.isArray(columns) || columns.length === 0) {
      return res.status(400).json({ error: 'Data master kolom tidak valid.' });
    }

    const clean = columns.filter(
      (c: any) => c && typeof c.key === 'string' && c.key.trim() && typeof c.label === 'string' && c.label.trim()
    );
    if (clean.length === 0) {
      return res.status(400).json({ error: 'Data master kolom tidak valid.' });
    }

    const normalized: MasterColumn[] = clean.map((c: any) => ({
      id: String(c.id || c.key),
      key: c.key.trim(),
      label: c.label.trim(),
      shortLabel: String(c.shortLabel || c.label).trim().slice(0, 30),
    }));

    await db.updateSetting('kua_master_columns', JSON.stringify(normalized));
    return res.json({ columns: normalized, message: 'Master kolom berhasil disimpan.' });
  } catch (err) {
    console.error('Update master columns error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
