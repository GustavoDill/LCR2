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
      inicio: 'write',
      reuniao: 'write',
      designacoes: 'write',
      mural: 'write',
      chamados: 'write',
      pessoas: 'write',
      membros: 'write',
      seminario: 'write',
      financeiro: 'write',
      agenda: 'write',
      atividades: 'write',
      natal: 'write',
      indicadores: 'write',
      atas: 'write',
      importar: 'write',
      gerenciamento: 'write',
    };
  }

  if (role === 'lider_org') {
    return {
      inicio: 'read',
      reuniao: 'read',
      designacoes: 'write',
      mural: 'write',
      chamados: 'read',
      pessoas: 'none',
      membros: 'read', // Leader can view ward directory / their org
      seminario: 'none',
      financeiro: 'none',
      agenda: 'write',
      atividades: 'write',
      natal: 'write',
      indicadores: 'read',
      atas: 'read',
      importar: 'none',
      gerenciamento: 'none',
    };
  }

  // default 'conselho'
  return {
    inicio: 'read',
    reuniao: 'read',
    designacoes: 'write',
    mural: 'read',
    chamados: 'none',
    pessoas: 'none',
    membros: 'none',
    seminario: 'none',
    financeiro: 'none',
    agenda: 'read',
    atividades: 'read',
    natal: 'read',
    indicadores: 'read',
    atas: 'read',
    importar: 'none',
    gerenciamento: 'none',
  };
}


export function getZeroPermissions(): UserPermissions {
  return {
    inicio: 'none',
    reuniao: 'none',
    designacoes: 'none',
    mural: 'none',
    chamados: 'none',
    pessoas: 'none',
    membros: 'none',
    seminario: 'none',
    financeiro: 'none',
    agenda: 'none',
    atividades: 'none',
    natal: 'none',
    indicadores: 'none',
    atas: 'none',
    importar: 'none',
    gerenciamento: 'none',
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
      else if (requestedRole === 'pendente') role = 'conselho';

      const isBisp = role === 'bispado' && requestedRole !== 'pendente';
      const isPendente = requestedRole === 'pendente';

      req.user = {
        uid: isBisp ? 'dev-bishop-001' : isPendente ? 'dev-pending-001' : role === 'lider_org' ? 'dev-leader-001' : 'dev-council-001',
        email: isBisp ? 'bispo@alabosque.org' : isPendente ? 'novo@alabosque.org' : 'lider@alabosque.org',
        displayName: isBisp ? 'Bispo Ala Bosque' : isPendente ? 'Novo Usuário Pendente' : role === 'lider_org' ? 'Líder da Soc. Socorro' : 'Líder do Conselho',
        role,
        isBishopric: isBisp,
        canWrite: !isPendente,
        cargo: isBisp ? 'Bispo' : isPendente ? 'Aguardando Aprovação' : role === 'lider_org' ? 'Pres. Sociedade de Socorro' : 'Conselheiro',
        organizacao: role === 'lider_org' ? 'Sociedade de Socorro' : undefined,
        permissoes: isPendente ? getZeroPermissions() : getDefaultPermissions(role),
        ativo: true,
        statusAcesso: isPendente ? 'pendente' : 'aprovado',
        receberNotificacoesCadastro: isBisp,
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
      const statusAcesso: 'pendente' | 'aprovado' | 'recusado' = data.statusAcesso || (isBisp ? 'aprovado' : (data.permissoes ? 'aprovado' : 'pendente'));
      const defaultPerms = statusAcesso === 'pendente' ? getZeroPermissions() : getDefaultPermissions(role);
      const permissoes = { ...defaultPerms, ...(data.permissoes || {}) };

      profile = {
        uid,
        email: data.email || email,
        displayName: data.displayName || displayName,
        role,
        isBishopric: isBisp,
        canWrite: data.canWrite !== false && statusAcesso === 'aprovado',
        cargo: data.cargo || (isBisp ? 'Membro do Bispado' : role === 'lider_org' ? 'Líder de Organização' : statusAcesso === 'pendente' ? 'Aguardando Aprovação' : 'Líder do Conselho'),
        organizacao: data.organizacao,
        permissoes,
        ativo: data.ativo !== false,
        statusAcesso,
        solicitacaoAcesso: data.solicitacaoAcesso,
        receberNotificacoesCadastro: data.receberNotificacoesCadastro === true,
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
      const initialPerms = isBishop ? getDefaultPermissions('bispado') : getZeroPermissions();

      profile = {
        uid,
        email,
        displayName,
        role: assignedRole,
        isBishopric: isBishop,
        canWrite: isBishop,
        cargo: isBishop ? 'Bispo / Administrador' : 'Aguardando Aprovação',
        permissoes: initialPerms,
        ativo: true,
        statusAcesso: isBishop ? 'aprovado' : 'pendente',
        receberNotificacoesCadastro: isBishop,
        solicitacaoAcesso: !isBishop ? {
          solicitadoEm: Date.now(),
          status: 'pendente',
        } : undefined,
        criadoEm: Date.now(),
        ultimoAcesso: Date.now(),
      };

      await userDocRef.set(profile);

      // Set custom user claims in Firebase Auth for fast JWT validation
      try {
        await auth.setCustomUserClaims(uid, {
          role: assignedRole,
          isBishopric: isBishop,
          canWrite: isBishop,
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

export function requirePermission(modulo: keyof UserPermissions, requireWriteAction: boolean = false) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuário não autenticado.' });
      return;
    }

    // Bishopric always has full access
    if (req.user.isBishopric || req.user.role === 'bispado') {
      return next();
    }

    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) || requireWriteAction;
    let perm = req.user.permissoes ? req.user.permissoes[modulo] : undefined;

    // Fallback to role defaults if undefined
    if (perm === undefined) {
      const defaults = getDefaultPermissions(req.user.role);
      perm = defaults[modulo];
    }

    // Block none or false
    if (perm === false || perm === 'none' || perm === undefined) {
      res.status(403).json({
        error: `Acesso negado. Seu perfil não possui permissão para acessar o módulo de ${modulo}.`,
      });
      return;
    }

    // Check read-only permission
    if (perm === 'read') {
      if (isMutation) {
        res.status(403).json({
          error: `Seu perfil possui apenas permissão de visualização (leitura) no módulo de ${modulo}.`,
        });
        return;
      }
      return next();
    }

    // Check write / true permission
    if (perm === true || perm === 'write') {
      if (isMutation && req.user.canWrite === false) {
        res.status(403).json({
          error: 'Seu perfil permite apenas visualização dos dados. Contate o Bispado para permissão de escrita.',
        });
        return;
      }
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
