import { Request, Response, NextFunction } from 'express';
import { getAuth, getDb, isMockFirebase } from '../config/firebase.js';
import { UserProfile, UserRole, UserPermissions } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

export function getDefaultPermissions(role: UserRole): UserPermissions {
  if (role === 'bispado') {
    return {
      inicio: true,
      reuniao: true,
      designacoes: true,
      chamados: true,
      pessoas: true,
      membros: true,
      seminario: true,
      financeiro: true,
      agenda: true,
      atividades: true,
      natal: true,
      indicadores: true,
      atas: true,
      importar: true,
    };
  }

  if (role === 'lider_org') {
    return {
      inicio: true,
      reuniao: true,
      designacoes: true,
      chamados: true,
      pessoas: false,
      membros: true, // Leader can view ward directory / their org
      seminario: false,
      financeiro: false,
      agenda: true,
      atividades: true,
      natal: true,
      indicadores: true,
      atas: true,
      importar: false,
    };
  }

  // default 'conselho'
  return {
    inicio: true,
    reuniao: true,
    designacoes: true,
    chamados: false,
    pessoas: false,
    membros: false,
    seminario: false,
    financeiro: false,
    agenda: true,
    atividades: true,
    natal: true,
    indicadores: true,
    atas: true,
    importar: false,
  };
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const devAllowAnonymous = process.env.DEV_ALLOW_ANONYMOUS === 'true';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (devAllowAnonymous || isMockFirebase()) {
      // In dev mode or mock mode, infer role from custom header or default to bishopric
      const requestedRole = (req.headers['x-role'] as string)?.toLowerCase();
      let role: UserRole = 'bispado';
      if (requestedRole === 'lider_org') role = 'lider_org';
      else if (requestedRole === 'conselho' || requestedRole === 'council') role = 'conselho';

      const isBisp = role === 'bispado';

      req.user = {
        uid: isBisp ? 'dev-bishop-001' : role === 'lider_org' ? 'dev-leader-001' : 'dev-council-001',
        email: isBisp ? 'bispo@alabosque.org' : 'lider@alabosque.org',
        displayName: isBisp ? 'Bispo Ala Bosque' : role === 'lider_org' ? 'Líder da Soc. Socorro' : 'Líder do Conselho',
        role,
        isBishopric: isBisp,
        canWrite: true,
        cargo: isBisp ? 'Bispo' : role === 'lider_org' ? 'Pres. Sociedade de Socorro' : 'Conselheiro',
        organizacao: role === 'lider_org' ? 'Sociedade de Socorro' : undefined,
        permissoes: getDefaultPermissions(role),
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
      req.user = {
        uid: 'dev-token-user',
        email: 'lider@alabosque.org',
        role: 'bispado',
        isBishopric: true,
        canWrite: true,
        permissoes: getDefaultPermissions('bispado'),
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

      const role: UserRole = data.role || (data.isBishopric ? 'bispado' : 'conselho');
      const isBisp = role === 'bispado' || data.isBishopric === true;
      const defaultPerms = getDefaultPermissions(role);
      const permissoes = { ...defaultPerms, ...(data.permissoes || {}) };

      profile = {
        uid,
        email: data.email || email,
        displayName: data.displayName || displayName,
        role,
        isBishopric: isBisp,
        canWrite: data.canWrite !== false,
        cargo: data.cargo || (isBisp ? 'Membro do Bispado' : role === 'lider_org' ? 'Líder de Organização' : 'Líder do Conselho'),
        organizacao: data.organizacao,
        permissoes,
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

      const isBishop = isFirstUser || email.toLowerCase().includes('bispo');
      const assignedRole: UserRole = isBishop ? 'bispado' : 'conselho';
      const initialPerms = getDefaultPermissions(assignedRole);

      profile = {
        uid,
        email,
        displayName,
        role: assignedRole,
        isBishopric: isBishop,
        canWrite: true,
        cargo: isBishop ? 'Bispo / Administrador' : 'Líder do Conselho',
        permissoes: initialPerms,
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

export function requirePermission(modulo: keyof UserPermissions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuário não autenticado.' });
      return;
    }

    // Bishopric always has full access
    if (req.user.isBishopric || req.user.role === 'bispado') {
      return next();
    }

    // Check fine-grained custom permission
    if (req.user.permissoes && req.user.permissoes[modulo] === true) {
      return next();
    }

    res.status(403).json({
      error: `Acesso negado. Seu perfil não possui permissão para acessar o módulo de ${modulo}.`,
    });
  };
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
