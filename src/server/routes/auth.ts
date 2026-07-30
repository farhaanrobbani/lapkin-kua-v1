import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, getKuaInstansi } from '../db/database';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const userWithHash = await db.getUserByEmail(email);
    if (!userWithHash) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const match = bcrypt.compareSync(password, (userWithHash as any)._passwordHash || '');
    if (!match) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const user = await db.getUserById(userWithHash.id);
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      nama: user.nama
    });

    return res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      email, password, nama, nip, jabatan, level_jabatan, pangkat, ruang_golongan,
      grade_tukin, jumlah_tukin_kotor, jumlah_tukin_bersih, gapok,
      instansi, foto_profil_url, tanda_tangan_url
    } = req.body;

    if (!email || !password || !nama || !nip) {
      return res.status(400).json({ error: 'Email, password, nama, dan NIP wajib diisi.' });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email sudah terdaftar dalam sistem.' });
    }

    const defaultInstansi = await getKuaInstansi();
    const newUser = await db.createUser(
      {
        id: '',
        email,
        role: 'staf',
        nama,
        nip,
        jabatan: jabatan || 'Penghulu Ahli Pertama',
        level_jabatan: level_jabatan || 'Fungsional',
        pangkat: pangkat || 'Penata Muda',
        ruang_golongan: ruang_golongan || 'III/a',
        grade_tukin: Number(grade_tukin) || 8,
        jumlah_tukin_kotor: Number(jumlah_tukin_kotor) || 4595000,
        jumlah_tukin_bersih: Number(jumlah_tukin_bersih) || 4365250,
        gapok: Number(gapok) || 3600000,
        foto_profil_url: foto_profil_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        tanda_tangan_url: tanda_tangan_url || '',
        instansi: instansi || defaultInstansi
      },
      password
    );

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      nama: newUser.nama
    });

    return res.status(201).json({ token, user: newUser });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Tidak diautentikasi' });
    const user = await db.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    return res.json({ user });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Tidak diautentikasi' });
    const updatedUser = await db.updateUser(req.user.id, req.body);
    if (!updatedUser) return res.status(400).json({ error: 'Gagal memperbarui profil.' });
    return res.json({ user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
