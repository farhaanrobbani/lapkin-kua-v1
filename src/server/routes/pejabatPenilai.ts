import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = await db.getPejabatPenilai();
    return res.json({ pejabatPenilai: data });
  } catch (err) {
    console.error('Get pejabat penilai error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.put('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { nama, nip, jabatan, stempel_url, tanda_tangan_url, opsi_anchor_ttd } = req.body;
    if (!nama || !nip || !jabatan) {
      return res.status(400).json({ error: 'Nama, NIP, dan Jabatan Pejabat Penilai wajib diisi.' });
    }

    const updated = await db.updatePejabatPenilai({
      nama,
      nip,
      jabatan,
      stempel_url: stempel_url || '',
      tanda_tangan_url: tanda_tangan_url || '',
      opsi_anchor_ttd: opsi_anchor_ttd || ''
    });

    return res.json({ pejabatPenilai: updated, message: 'Data Pejabat Penilai berhasil diperbarui.' });
  } catch (err) {
    console.error('Update pejabat penilai error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
