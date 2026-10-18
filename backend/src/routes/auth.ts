import { Router } from 'express';
import { authenticate, requireBishopric } from '../middlewares/auth.js';
import { getAuth, getDb } from '../config/firebase.js';
import { UserProfile } from '../types/index.js';

const router = Router();

// Current authenticated user info
router.get('/me', authenticate, (req, res) => {
  res.json({
    user: req.user,
  });
});

// List all registered users (Bishopric only)
router.get('/users', authenticate, requireBishopric, async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection('usuarios').get();
    const users: UserProfile[] = [];

    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() } as any);
    });

    // Sort by name or creation
    users.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));

    res.json(users);
  } catch (err: any) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Erro ao buscar lista de usuários.' });
  }
});

// Update a user's role and permissions (Bishopric only)
router.put('/users/:uid', authenticate, requireBishopric, async (req, res) => {
  const { uid } = req.params;
  const { role, cargo, organizacao, permissoes, canWrite, ativo, displayName } = req.body;

  try {
    const db = getDb();
    const auth = getAuth();
    const userDocRef = db.collection('usuarios').doc(uid);

    const doc = await userDocRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const currentData = doc.data() as any;
    const targetRole = (role || currentData.role || 'conselho');
    const isBishop = targetRole === 'bispado';

    const updates: Partial<UserProfile> = {
      ...(role !== undefined && { role: targetRole, isBishopric: isBishop }),
      ...(cargo !== undefined && { cargo }),
      ...(organizacao !== undefined && { organizacao }),
      ...(permissoes !== undefined && { permissoes }),
      ...(canWrite !== undefined && { canWrite: Boolean(canWrite) }),
      ...(ativo !== undefined && { ativo: Boolean(ativo) }),
      ...(displayName !== undefined && { displayName }),
      ultimoAcesso: Date.now(),
    };

    await userDocRef.update(updates);

    // Update Firebase Auth custom claims if auth is active
    if (auth) {
      try {
        await auth.setCustomUserClaims(uid, {
          role: updates.role || (doc.data() as any).role,
          isBishopric: isBishop,
          canWrite: updates.canWrite !== undefined ? updates.canWrite : (doc.data() as any).canWrite,
        });
      } catch (err) {
        console.warn('Could not update custom user claims:', err);
      }
    }

    const updated = await userDocRef.get();
    res.json({ id: uid, ...updated.data() });
  } catch (err: any) {
    console.error('Error updating user permissions:', err);
    res.status(500).json({ error: 'Erro ao atualizar permissões do usuário.' });
  }
});

// Delete or remove user (Bishopric only)
router.delete('/users/:uid', authenticate, requireBishopric, async (req, res) => {
  const { uid } = req.params;

  // Prevent self-deletion
  if (req.user?.uid === uid) {
    res.status(400).json({ error: 'Você não pode excluir sua própria conta enquanto estiver conectado.' });
    return;
  }

  try {
    const db = getDb();
    const auth = getAuth();

    await db.collection('usuarios').doc(uid).delete();

    if (auth) {
      try {
        await auth.deleteUser(uid);
      } catch (err) {
        console.warn(`User ${uid} could not be deleted from Firebase Auth directly:`, err);
      }
    }

    res.json({ success: true, message: 'Usuário excluído com sucesso.' });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

export default router;
