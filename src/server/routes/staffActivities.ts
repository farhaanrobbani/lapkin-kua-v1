import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { KUA_ACTIVITY_MAPPING } from '../../types/index';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const queryUserId = req.query.user_id ? String(req.query.user_id) : undefined;
  const userId = queryUserId === 'all' ? undefined : (queryUserId || req.user?.id);
  const month = req.query.month ? Number(req.query.month) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;

  const activities = await db.getStaffActivities(userId, month, year);
  return res.json({ activities });
}));

router.post('/batch', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items } = req.body;
  const user_id = req.body.user_id || req.user?.id;

  if (!Array.isArray(items) || items.length === 0 || !user_id) {
    return res.status(400).json({ error: 'Data items (array) dan user_id wajib diisi.' });
  }

  const createdActivities = [];
  for (const item of items) {
    const { tanggal, kegiatan, pekerjaan, activity_type_key, total_jumlah } = item;
    if (!tanggal || !kegiatan || !pekerjaan) continue;

    let finalTotal = Number(total_jumlah) || 1;

    const newAct = await db.createStaffActivity({
      user_id, tanggal, kegiatan, pekerjaan,
      activity_type_key, total_jumlah: finalTotal
    });
    createdActivities.push(newAct);
  }

  return res.status(201).json({ activities: createdActivities, message: `${createdActivities.length} kegiatan berhasil ditambahkan ke laporan.` });
}));

router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { tanggal, kegiatan, pekerjaan, activity_type_key, total_jumlah } = req.body;
  const user_id = req.body.user_id || req.user?.id;

  if (!tanggal || !kegiatan || !pekerjaan || !user_id) {
    return res.status(400).json({ error: 'Tanggal, kegiatan, pekerjaan, dan user_id wajib diisi.' });
  }

  let finalTotal = Number(total_jumlah) || 1;

  if (activity_type_key && KUA_ACTIVITY_MAPPING[activity_type_key]) {
    const field = KUA_ACTIVITY_MAPPING[activity_type_key].field;
    const dailyData = await db.getKuaDailyByDate(tanggal);
    if (dailyData && typeof dailyData[field] === 'number') {
      finalTotal = dailyData[field] as number;
    }
  }

  const newActivity = await db.createStaffActivity({
    user_id, tanggal, kegiatan, pekerjaan,
    activity_type_key, total_jumlah: finalTotal
  });

  return res.status(201).json({ activity: newActivity });
}));

router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { tanggal, kegiatan, pekerjaan, activity_type_key, total_jumlah } = req.body;

  let finalTotal = total_jumlah !== undefined ? Number(total_jumlah) : undefined;

  if (activity_type_key && tanggal && KUA_ACTIVITY_MAPPING[activity_type_key]) {
    const field = KUA_ACTIVITY_MAPPING[activity_type_key].field;
    const dailyData = await db.getKuaDailyByDate(tanggal);
    if (dailyData && typeof dailyData[field] === 'number') {
      finalTotal = dailyData[field] as number;
    }
  }

  const updated = await db.updateStaffActivity(id, {
    ...(tanggal && { tanggal }),
    ...(kegiatan && { kegiatan }),
    ...(pekerjaan && { pekerjaan }),
    ...(activity_type_key !== undefined && { activity_type_key }),
    ...(finalTotal !== undefined && { total_jumlah: finalTotal })
  });

  if (!updated) {
    return res.status(404).json({ error: 'Log kegiatan tidak ditemukan.' });
  }

  return res.json({ activity: updated });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const deleted = await db.deleteStaffActivity(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Log kegiatan tidak ditemukan.' });
  }
  return res.json({ message: 'Log kegiatan berhasil dihapus.' });
}));

export default router;
