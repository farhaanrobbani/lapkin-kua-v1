import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.query.user_id ? String(req.query.user_id) : req.user!.id;
    const templates = await db.getUserActivityTemplates(userId);
    const map = await db.getUserActivityTemplatesMap(userId);
    return res.json({ templates, map });
  } catch (err) {
    console.error('Get user templates error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const { templates } = req.body;
    if (!Array.isArray(templates)) {
      return res.status(400).json({ error: 'templates harus berupa array.' });
    }

    const userId = req.body.user_id || req.user!.id;
    const saved = await db.bulkUpsertUserActivityTemplates(userId, templates);
    return res.json({ templates: saved, message: `${saved.length} template kalimat berhasil disimpan.` });
  } catch (err) {
    console.error('Update user templates error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.delete('/:activity_type_key', async (req: AuthRequest, res: Response) => {
  try {
    const { activity_type_key } = req.params;
    const userId = req.query.user_id ? String(req.query.user_id) : req.user!.id;
    const deleted = await db.deleteUserActivityTemplate(userId, activity_type_key);
    if (!deleted) {
      return res.status(404).json({ error: 'Template tidak ditemukan.' });
    }
    return res.json({ message: 'Template berhasil dihapus.' });
  } catch (err) {
    console.error('Delete user template error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
