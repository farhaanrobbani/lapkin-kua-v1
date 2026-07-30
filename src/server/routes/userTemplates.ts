import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.query.user_id ? String(req.query.user_id) : req.user!.id;
  const templates = await db.getUserActivityTemplates(userId);
  const map = await db.getUserActivityTemplatesMap(userId);
  return res.json({ templates, map });
}));

router.put('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { templates } = req.body;
  if (!Array.isArray(templates)) {
    return res.status(400).json({ error: 'templates harus berupa array.' });
  }

  const userId = req.body.user_id || req.user!.id;
  const saved = await db.bulkUpsertUserActivityTemplates(userId, templates);
  return res.json({ templates: saved, message: `${saved.length} template kalimat berhasil disimpan.` });
}));

router.delete('/:activity_type_key', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { activity_type_key } = req.params;
  const userId = req.query.user_id ? String(req.query.user_id) : req.user!.id;
  const deleted = await db.deleteUserActivityTemplate(userId, activity_type_key);
  if (!deleted) {
    return res.status(404).json({ error: 'Template tidak ditemukan.' });
  }
  return res.json({ message: 'Template berhasil dihapus.' });
}));

export default router;
