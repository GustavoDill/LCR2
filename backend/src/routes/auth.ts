import { Router } from 'express';
import { authenticate, requirePermission, isSystemAdminUid } from '../middlewares/auth.js';
import { getAuth, getDb } from '../config/firebase.js';
import { UserProfile } from '../types/index.js';
import {
  getAdminRecipientsForNewRegistrations,
  sendAccessRequestEmail,
  sendAccessApprovedEmail,
} from '../services/email.js';

const router = Router();

// Current authenticated user info
router.get('/me', authenticate, (req, res) => {
  res.json({
    user: req.user,
  });
});

// Request access / Submit calling & justification for pending users
router.post('/request-access', authenticate, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }

  const { cargo, organizacao, justificativa } = req.body;

  try {
    const db = getDb();
    const userDocRef = db.collection('usuarios').doc(req.user.uid);

    const cargoSolicitado = cargo?.trim() || req.user.cargo || 'Não informado';
    const organizacaoSolicitada = organizacao?.trim() || req.user.organizacao || '';
    const justificativaSolicitada = justificativa?.trim() || '';

    const solicitacaoAcesso = {
      cargo: cargoSolicitado,
      organizacao: organizacaoSolicitada,
      justificativa: justificativaSolicitada,
      solicitadoEm: Date.now(),
      status: 'pendente' as const,
    };

    const updates: any = {
      solicitacaoAcesso,
      statusAcesso: 'pendente',
      cargo: cargoSolicitado,
      ...(organizacaoSolicitada ? { organizacao: organizacaoSolicitada } : {}),
      ultimoAcesso: Date.now(),
    };

    await userDocRef.update(updates);

    // Look up administrators configured to receive new registration notifications
    const adminEmails = await getAdminRecipientsForNewRegistrations(db);

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const gerenciamentoUrl = `${appUrl}/gerenciamento`;

    // Asynchronously dispatch notification email to administrators
    sendAccessRequestEmail({
      adminEmails,
      solicitanteNome: req.user.displayName || req.user.email || 'Novo Usuário',
      solicitanteEmail: req.user.email || '',
      cargoSolicitado,
      organizacaoSolicitada,
      justificativa: justificativaSolicitada,
      dataSolicitacao: new Date().toLocaleString('pt-BR'),
      gerenciamentoUrl,
    }).catch(e => console.warn('Falha no envio assíncrono de notificação de cadastro:', e));

    res.json({
      success: true,
      message: 'Solicitação de acesso enviada com sucesso aos administradores da Ala Bosque.',
      solicitacaoAcesso,
    });
  } catch (err: any) {
    console.error('Error submitting access request:', err);
    res.status(500).json({ error: 'Erro ao registrar solicitação de acesso.' });
  }
});

// List all registered users (Gerenciamento read or write permission required)
router.get('/users', authenticate, requirePermission('gerenciamento', false), async (req, res) => {
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

// Update a user's role and permissions (Gerenciamento write permission required)
router.put('/users/:uid', authenticate, requirePermission('gerenciamento', true), async (req, res) => {
  const { uid } = req.params;
  const {
    role,
    cargo,
    organizacao,
    permissoes,
    canWrite,
    ativo,
    displayName,
    statusAcesso,
    receberNotificacoesCadastro,
  } = req.body;

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

    if (isSystemAdminUid(uid)) {
      if (ativo === false) {
        res.status(400).json({ error: 'A conta do Administrador do Sistema não pode ser desativada.' });
        return;
      }
      if (role && role !== 'bispado') {
        res.status(400).json({ error: 'O perfil do Administrador do Sistema deve permanecer como Bispado.' });
        return;
      }
    }

    const targetRole = role || currentData.role || 'conselho';
    const isBishop = targetRole === 'bispado';
    const finalPermissoes = permissoes !== undefined ? permissoes : (currentData.permissoes || {});
    const hasMgmtWrite = isBishop || finalPermissoes?.gerenciamento === 'write' || finalPermissoes?.gerenciamento === true;

    // Validate receberNotificacoesCadastro requirement
    if (receberNotificacoesCadastro === true && !hasMgmtWrite) {
      res.status(400).json({
        error: 'Apenas usuários com permissão de edição em Gerenciamento podem receber notificações de novos cadastros.',
      });
      return;
    }

    let finalReceberNotificacoes: boolean | undefined = undefined;
    if (receberNotificacoesCadastro !== undefined) {
      finalReceberNotificacoes = Boolean(receberNotificacoesCadastro) && hasMgmtWrite;
    } else if (!hasMgmtWrite && currentData.receberNotificacoesCadastro === true) {
      // If user lost management permission, revoke notification flag
      finalReceberNotificacoes = false;
    }

    // Determine status transition
    let nextStatusAcesso = statusAcesso !== undefined ? statusAcesso : currentData.statusAcesso;
    const wasPending = currentData.statusAcesso === 'pendente';
    // If user was pending and permissions were set or explicit approval passed
    if (wasPending && (statusAcesso === 'aprovado' || (permissoes && Object.values(permissoes).some(v => v === 'read' || v === 'write' || v === true)))) {
      nextStatusAcesso = 'aprovado';
    }

    const updates: Partial<UserProfile> = {
      ...(role !== undefined && { role: targetRole, isBishopric: isBishop }),
      ...(cargo !== undefined && { cargo }),
      ...(organizacao !== undefined && { organizacao }),
      ...(permissoes !== undefined && { permissoes: finalPermissoes }),
      ...(canWrite !== undefined && { canWrite: Boolean(canWrite) }),
      ...(ativo !== undefined && { ativo: Boolean(ativo) }),
      ...(displayName !== undefined && { displayName }),
      ...(nextStatusAcesso !== undefined && { statusAcesso: nextStatusAcesso }),
      ...(finalReceberNotificacoes !== undefined && { receberNotificacoesCadastro: finalReceberNotificacoes }),
      ultimoAcesso: Date.now(),
    };

    await userDocRef.update(updates);

    // If account was just approved, notify user by email
    if (wasPending && nextStatusAcesso === 'aprovado' && currentData.email) {
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      sendAccessApprovedEmail({
        to: currentData.email,
        userName: updates.displayName || currentData.displayName || currentData.name || 'Líder',
        cargo: updates.cargo || currentData.cargo,
        organizacao: updates.organizacao || currentData.organizacao,
        appUrl,
      }).catch(e => console.warn('Falha no envio assíncrono de e-mail de aprovação:', e));
    }

    // Update Firebase Auth custom claims if auth is active
    if (auth) {
      try {
        await auth.setCustomUserClaims(uid, {
          role: updates.role || currentData.role,
          isBishopric: isBishop,
          canWrite: updates.canWrite !== undefined ? updates.canWrite : currentData.canWrite,
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

// Delete or remove user (Gerenciamento write permission required)
router.delete('/users/:uid', authenticate, requirePermission('gerenciamento', true), async (req, res) => {
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
