import { initFirebase, getDb } from '../config/firebase.js';
import { DEFAULT_MURAL_DATA } from '../routes/mural.js';

async function seed() {
  console.log('Iniciando conexão com o Firebase...');
  const { isMock } = initFirebase();
  console.log('Status da conexão Firebase: isMock =', isMock);
  const db = getDb();
  console.log('Gravando último mural no Firestore em config/mural...');
  await db.doc('config/mural').set(DEFAULT_MURAL_DATA);
  console.log('✅ Último mural gravado com sucesso no Firebase!');
  
  const snap = await db.doc('config/mural').get();
  console.log('Verificação - dados no Firestore:');
  console.log(JSON.stringify(snap.data(), null, 2));
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Erro ao gravar mural no Firebase:', err);
  process.exit(1);
});
