import { Request, Response, NextFunction } from 'express';
import { getAuth, getDb, isMockFirebase } from '../config/firebase.js';
import { UserProfile } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const devAllowAnonymous = process.env.DEV_ALLOW_ANONYMOUS === 'true';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (devAllowAnonymous || isMockFirebase()) {
      // In dev mode or mock mode, infer role from custom header or default to bishopric
      const requestedRole = (req.headers['x-role'] as string)?.toLowerCase();
      const isBisp = requestedRole ? requestedRole === 'bishopric' || requestedRole === 'bispado' : true;

      req.user = {
        uid: isBisp ? 'dev-bishop-001' : 'dev-council-001',
        email: isBisp ? 'bispo@alabosque.org' : 'lider@alabosque.org',
        displayName: isBisp ? 'Bispo Ala Bosque' : 'Líder do Conselho',
        role: isBisp ? 'bispado' : 'conselho',
        isBishopric: isBisp,
        canWrite: true,
        cargo: isBisp ? 'Bispo' : 'Conselheiro',
        ativo: true,
        criadoEm: Date.now(),
        ultimoAcesso: Date.now(),
      };
      return next();
    }
    res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    return;
  }

  const token = authHeader.split('Bearer ')[1].trim();

  try {
    const auth = getAuth();
    const db = getDb();

    if (!auth) {
      // Fallback dev mode when auth is not initialized
      req.user = {
        uid: 'dev-token-user',
        email: 'lider@alabosque.org',
        role: 'bispado',
        isBishopric: true,
        canWrite: true,
        ativo: true,
      };
      return next();
    }

    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email || '';
    const displayName = decoded.name || email.split('@')[0] || 'Usuário';

    // Retrieve or initialize user profile in Firestore
    const userDocRef = db.collection('usuarios').doc(uid);
    const userDoc = await userDocRef.get();

    let profile: UserProfile;

    if (userDoc.exists) {
      const data = userDoc.data() as any;
      if (data.ativo === false) {
        res.status(403).json({ error: 'Sua conta de usuário foi desativada pelo Bispado.' });
        return;
      }

      profile = {
        uid,
        email: data.email || email,
        displayName: data.displayName || displayName,
        role: data.role === 'bispado' ? 'bispado' : 'conselho',
        isBishopric: data.role === 'bispado' || data.isBishopric === true,
        canWrite: data.canWrite !== false,
        cargo: data.cargo || (data.role === 'bispado' ? 'Membro do Bispado' : 'Líder do Conselho'),
        organizacao: data.organizacao,
        ativo: data.ativo !== false,
        criadoEm: data.criadoEm || Date.now(),
        ultimoAcesso: Date.now(),
      };

      // Asynchronously record last access
      userDocRef.update({ ultimoAcesso: Date.now() }).catch(() => {});
    } else {
      // User doesn't exist yet in Firestore
      // Check if this is the very first user in the system
      const existingSnapshot = await db.collection('usuarios').limit(1).get();
      const isFirstUser = existingSnapshot.empty;

      // First user is automatically assigned as Bishop/Admin
      const isBishop = isFirstUser || email.toLowerCase().includes('bispo');
      const assignedRole: 'bispado' | 'conselho' = isBishop ? 'bispado' : 'conselho';

      profile = {
        uid,
        email,
        displayName,
        role: assignedRole,
        isBishopric: isBishop,
        canWrite: true,
        cargo: isBishop ? 'Bispo / Administrador' : 'Líder do Conselho',
        ativo: true,
        criadoEm: Date.now(),
        ultimoAcesso: Date.now(),
      };

      await userDocRef.set(profile);

      // Set custom user claims in Firebase Auth for fast JWT validation
      try {
        await auth.setCustomUserClaims(uid, {
          role: assignedRole,
          isBishopric: isBishop,
          canWrite: true,
        });
      } catch (err) {
        console.warn('Could not set custom user claims on first login:', err);
      }
    }

    req.user = profile;
    next();
  } catch (error: any) {
    console.error('Error verifying Firebase ID token:', error.message || error);
    res.status(401).json({ error: 'Token de autenticação inválido ou expirado.' });
  }
}

export function requireBishopric(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.isBishopric) {
    res.status(403).json({
      error: 'Acesso restrito. Somente membros do Bispado possuem permissão para esta ação.',
    });
    return;
  }
  next();
}

export function requireWrite(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.canWrite) {
    res.status(403).json({
      error: 'Seu perfil permite apenas visualização dos dados. Contate o Bispado para permissão de escrita.',
    });
    return;
  }
  next();
}
