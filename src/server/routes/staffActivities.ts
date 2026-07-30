import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { KUA_ACTIVITY_MAPPING } from '../../types/index';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const queryUserId = req.query.user_id ? String(req.query.user_id) : undefined;
    const userId = queryUserId === 'all' ? undefined : (queryUserId || req.user?.id);
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;

    const activities = await db.getStaffActivities(userId, month, year);
    return res.json({ activities });
  } catch (err) {
    console.error('Get staff activities error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.post('/batch', async (req: AuthRequest, res: Response) => {
  try {
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
        user_id,
        tanggal,
        kegiatan,
        pekerjaan,
        activity_type_key,
        total_jumlah: finalTotal
      });
      createdActivities.push(newAct);
    }

    return res.status(201).json({ activities: createdActivities, message: `${createdActivities.length} kegiatan berhasil ditambahkan ke laporan.` });
  } catch (err) {
    console.error('Batch staff activities error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
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
        finalTotal = dailyData[field];
      }
    }

    const newActivity = await db.createStaffActivity({
      user_id,
      tanggal,
      kegiatan,
      pekerjaan,
      activity_type_key,
      total_jumlah: finalTotal
    });

    return res.status(201).json({ activity: newActivity });
  } catch (err) {
    console.error('Create staff activity error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tanggal, kegiatan, pekerjaan, activity_type_key, total_jumlah } = req.body;

    let finalTotal = total_jumlah !== undefined ? Number(total_jumlah) : undefined;

    if (activity_type_key && tanggal && KUA_ACTIVITY_MAPPING[activity_type_key]) {
      const field = KUA_ACTIVITY_MAPPING[activity_type_key].field;
      const dailyData = await db.getKuaDailyByDate(tanggal);
      if (dailyData && typeof dailyData[field] === 'number') {
        finalTotal = dailyData[field];
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
  } catch (err) {
    console.error('Update staff activity error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteStaffActivity(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Log kegiatan tidak ditemukan.' });
    }
    return res.json({ message: 'Log kegiatan berhasil dihapus.' });
  } catch (err) {
    console.error('Delete staff activity error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
