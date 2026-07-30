import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/pejabat-penilai (Public to authenticated users)
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const data = db.getPejabatPenilai();
  return res.json({ pejabatPenilai: data });
});

// PUT /api/pejabat-penilai (Admin only)
router.put('/', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const { nama, nip, jabatan, stempel_url, tanda_tangan_url } = req.body;
  if (!nama || !nip || !jabatan) {
    return res.status(400).json({ error: 'Nama, NIP, dan Jabatan Pejabat Penilai wajib diisi.' });
  }

  const updated = db.updatePejabatPenilai({
    nama,
    nip,
    jabatan,
    stempel_url: stempel_url || '',
    tanda_tangan_url: tanda_tangan_url || ''
  });

  return res.json({ pejabatPenilai: updated, message: 'Data Pejabat Penilai berhasil diperbarui.' });
});

export default router;
