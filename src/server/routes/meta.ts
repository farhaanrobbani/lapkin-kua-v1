import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/years', async (_req: AuthRequest, res: Response) => {
  try {
    const years = await db.getAvailableYears();
    return res.json({ years });
  } catch (err) {
    console.error('Get available years error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
