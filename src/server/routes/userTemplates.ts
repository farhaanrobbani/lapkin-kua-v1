import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/user-templates - Get all templates for current user (admin can query ?user_id=xxx)
router.get('/', (req: AuthRequest, res: Response) => {
  const userId = req.query.user_id ? String(req.query.user_id) : req.user!.id;
  const templates = db.getUserActivityTemplates(userId);
  const map = db.getUserActivityTemplatesMap(userId);
  return res.json({ templates, map });
});

// PUT /api/user-templates - Bulk save/update templates for current user
router.put('/', (req: AuthRequest, res: Response) => {
  const { templates } = req.body;
  if (!Array.isArray(templates)) {
    return res.status(400).json({ error: 'templates harus berupa array.' });
  }

  const userId = req.body.user_id || req.user!.id;
  const saved = db.bulkUpsertUserActivityTemplates(userId, templates);
  return res.json({ templates: saved, message: `${saved.length} template kalimat berhasil disimpan.` });
});

// DELETE /api/user-templates/:activity_type_key
router.delete('/:activity_type_key', (req: AuthRequest, res: Response) => {
  const { activity_type_key } = req.params;
  const userId = req.query.user_id ? String(req.query.user_id) : req.user!.id;
  const deleted = db.deleteUserActivityTemplate(userId, activity_type_key);
  if (!deleted) {
    return res.status(404).json({ error: 'Template tidak ditemukan.' });
  }
  return res.json({ message: 'Template berhasil dihapus.' });
});

export default router;
