import { Router, Response } from 'express';
import { db } from '../db/database';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const users = await db.getUsers();
    return res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      email, password, role, nama, nip, jabatan, level_jabatan, pangkat, ruang_golongan,
      grade_tukin, jumlah_tukin_kotor, jumlah_tukin_bersih, gapok,
      instansi, foto_profil_url, tanda_tangan_url
    } = req.body;

    if (!email || !password || !nama || !nip || !role) {
      return res.status(400).json({ error: 'Email, password, nama, NIP, dan role wajib diisi.' });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email sudah digunakan.' });
    }

    const user = await db.createUser(
      {
        id: '',
        email,
        role,
        nama,
        nip,
        jabatan: jabatan || 'Staf / Pegawai KUA',
        level_jabatan: level_jabatan || 'Pelaksana',
        pangkat: pangkat || 'Penata Muda',
        ruang_golongan: ruang_golongan || 'III/a',
        grade_tukin: Number(grade_tukin) || 8,
        jumlah_tukin_kotor: Number(jumlah_tukin_kotor) || 0,
        jumlah_tukin_bersih: Number(jumlah_tukin_bersih) || 0,
        gapok: Number(gapok) || 0,
        foto_profil_url: foto_profil_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        tanda_tangan_url: tanda_tangan_url || '',
        instansi: instansi || 'KUA Ampelgading'
      },
      password
    );

    return res.status(201).json({ user });
  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await db.updateUser(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }
    return res.json({ user: updated });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
    }
    const deleted = await db.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }
    return res.json({ message: 'Pengguna berhasil dihapus.' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
