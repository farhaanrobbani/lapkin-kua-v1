import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const data = await db.getPejabatPenilai();
  return res.json({ pejabatPenilai: data });
}));

router.put('/', authMiddleware, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { nama, nip, jabatan, stempel_url, tanda_tangan_url } = req.body;
  if (!nama || !nip || !jabatan) {
    return res.status(400).json({ error: 'Nama, NIP, dan Jabatan Pejabat Penilai wajib diisi.' });
  }

  const updated = await db.updatePejabatPenilai({ nama, nip, jabatan, stempel_url: stempel_url || '', tanda_tangan_url: tanda_tangan_url || '' });
  return res.json({ pejabatPenilai: updated, message: 'Data Pejabat Penilai berhasil diperbarui.' });
}));

export default router;
