import { initFirebase, getDb, getAuth } from '../src/config/firebase.js';
import { getDefaultPermissions } from '../src/middlewares/auth.js';

async function main() {
  const targetUid = process.argv[2] || 'Pjx9THHjCQXYBL5QXgvXDfjvSzP2';

  console.log(`\n======================================================`);
  console.log(`🔐 CONFIGURANDO CONTA DO SISTEMA (ADMIN MASTER)`);
  console.log(`🎯 UID Alvo: ${targetUid}`);
  console.log(`======================================================\n`);

  initFirebase();
  const db = getDb();
  const auth = getAuth();

  let email = '';
  let displayName = 'Administrador do Sistema';

  if (auth) {
    try {
      const userRecord = await auth.getUser(targetUid);
      email = userRecord.email || '';
      displayName = userRecord.displayName || displayName;
      console.log(`👤 Usuário encontrado no Firebase Auth:`);
      console.log(`   - Email: ${email}`);
      console.log(`   - Nome: ${displayName}`);
      console.log(`   - Provedor: ${userRecord.providerData.map(p => p.providerId).join(', ') || 'N/A'}`);

      // Set custom claims
      await auth.setCustomUserClaims(targetUid, {
        role: 'bispado',
        isBishopric: true,
        canWrite: true,
        systemAdmin: true,
      });
      console.log(`✅ Custom Claims configuradas no Firebase Auth (role: bispado, systemAdmin: true)`);
    } catch (err: any) {
      console.warn(`⚠️ Não foi possível carregar usuário no Firebase Auth (${err.message}). Continuando com Firestore...`);
    }
  }

  const userDocRef = db.collection('usuarios').doc(targetUid);
  const existingDoc = await userDocRef.get();
  const currentData = existingDoc.exists ? existingDoc.data() : {};

  const fullPerms = getDefaultPermissions('bispado');

  const updateData = {
    uid: targetUid,
    email: email || currentData?.email || 'admin@alabosque.org',
    displayName: currentData?.displayName || displayName,
    role: 'bispado',
    isBishopric: true,
    canWrite: true,
    ativo: true,
    statusAcesso: 'aprovado',
    cargo: currentData?.cargo && currentData?.cargo !== 'Aguardando Aprovação' ? currentData.cargo : 'Administrador do Sistema',
    receberNotificacoesCadastro: true,
    permissoes: fullPerms,
    ultimoAcesso: Date.now(),
  };

  await userDocRef.set(updateData, { merge: true });

  console.log(`✅ Documento em "usuarios/${targetUid}" atualizado no Firestore com sucesso:`);
  console.log(`   - Papel: bispado (Acesso Total)`);
  console.log(`   - Status de Acesso: aprovado`);
  console.log(`   - Notificações de Cadastro: ativado`);
  console.log(`   - Permissões: 16/16 módulos com permissão de escrita ('write')\n`);
  console.log(`🎉 A conta com UID ${targetUid} agora é a CONTA DO SISTEMA definitiva!\n`);
}

main().catch(err => {
  console.error('❌ Erro ao configurar conta do sistema:', err);
  process.exit(1);
});
