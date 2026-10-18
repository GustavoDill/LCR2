import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requirePermission, requireBishopric, requireWrite } from '../middlewares/auth.js';
import { Membro, MembroMeta } from '../types/index.js';

const router = Router();
router.use(authenticate, requirePermission('membros'));

const norm = (s: any) =>
  String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const newMemId = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('conf/b/membros').get();

    let meta: MembroMeta | null = null;
    const members: Membro[] = [];

    snap.docs.forEach(doc => {
      if (doc.id === 'meta') {
        meta = doc.data() as MembroMeta;
      } else if (doc.id.startsWith('lista-')) {
        const arr = doc.data()?.membros;
        if (Array.isArray(arr)) {
          arr.forEach(m => members.push({ ...m, _c: doc.id }));
        }
      }
    });

    members.sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt'));
    res.json({ members, meta });
  } catch (error) {
    console.error('Error fetching membros:', error);
    res.status(500).json({ error: 'Erro ao carregar lista de membros.' });
  }
});

router.post('/', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { nome, sexo, nascimento, idade, telefone, email, endereco, chamado, obs } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do membro é obrigatório.' });
    }

    const snap = await db.collection('conf/b/membros').get();
    const chunks: Record<string, Membro[]> = {};
    let meta: MembroMeta = { total: 0, temChamado: false };

    snap.docs.forEach(doc => {
      if (doc.id === 'meta') meta = doc.data() as MembroMeta;
      else if (doc.id.startsWith('lista-')) chunks[doc.id] = doc.data()?.membros || [];
    });

    const newRec: Membro = {
      id: newMemId(),
      nome: nome.trim().replace(/\s+/g, ' '),
      sexo: sexo || '',
      nascimento: nascimento || '',
      idade: idade !== undefined && idade !== '' ? Number(idade) : '',
      telefone: telefone || '',
      email: email || '',
      endereco: endereco || '',
      chamado: chamado || '',
      obs: obs || '',
      atualizadoEm: Date.now(),
    };

    const ks = Object.keys(chunks).sort();
    let targetChunk = ks.find(k => chunks[k].length < 250);
    if (!targetChunk) {
      let n = 0;
      while (chunks['lista-' + n]) n++;
      targetChunk = 'lista-' + n;
      chunks[targetChunk] = [];
    }

    chunks[targetChunk].push(newRec);
    await db.doc(`conf/b/membros/${targetChunk}`).set({ membros: chunks[targetChunk] });

    if (chamado && !meta.temChamado) {
      meta.temChamado = true;
    }
    meta.total = (meta.total || 0) + 1;
    await db.doc('conf/b/membros/meta').set(meta);

    res.status(201).json(newRec);
  } catch (error) {
    console.error('Error adding membro:', error);
    res.status(500).json({ error: 'Erro ao cadastrar membro.' });
  }
});

router.put('/:id', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const snap = await db.collection('conf/b/membros').get();

    let targetDocId: string | null = null;
    let targetArray: Membro[] = [];

    for (const doc of snap.docs) {
      if (doc.id.startsWith('lista-')) {
        const arr = doc.data()?.membros as Membro[];
        if (Array.isArray(arr) && arr.some(m => m.id === id)) {
          targetDocId = doc.id;
          targetArray = arr;
          break;
        }
      }
    }

    if (!targetDocId) {
      return res.status(404).json({ error: 'Membro não encontrado.' });
    }

    const updatedArray = targetArray.map(m => {
      if (m.id === id) {
        return {
          ...m,
          ...req.body,
          id,
          atualizadoEm: Date.now(),
        };
      }
      return m;
    });

    await db.doc(`conf/b/membros/${targetDocId}`).set({ membros: updatedArray });
    const updatedMember = updatedArray.find(m => m.id === id);

    res.json(updatedMember);
  } catch (error) {
    console.error('Error updating membro:', error);
    res.status(500).json({ error: 'Erro ao atualizar membro.' });
  }
});

router.delete('/:id', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const snap = await db.collection('conf/b/membros').get();

    for (const doc of snap.docs) {
      if (doc.id.startsWith('lista-')) {
        const arr = doc.data()?.membros as Membro[];
        if (Array.isArray(arr) && arr.some(m => m.id === id)) {
          const filtered = arr.filter(m => m.id !== id);
          await db.doc(`conf/b/membros/${doc.id}`).set({ membros: filtered });
          return res.json({ success: true, id });
        }
      }
    }

    res.status(404).json({ error: 'Membro não encontrado.' });
  } catch (error) {
    console.error('Error deleting membro:', error);
    res.status(500).json({ error: 'Erro ao excluir membro.' });
  }
});

// Bulk Import & Merge Plan
router.post('/import', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { records, removeUnlisted } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Nenhum registro para importar.' });
    }

    const snap = await db.collection('conf/b/membros').get();
    const existingMembers: Membro[] = [];
    const oldChunkIds: string[] = [];

    snap.docs.forEach(doc => {
      if (doc.id.startsWith('lista-')) {
        oldChunkIds.push(doc.id);
        const arr = doc.data()?.membros;
        if (Array.isArray(arr)) existingMembers.push(...arr);
      }
    });

    const pool: Record<string, Membro[]> = {};
    existingMembers.forEach(m => {
      const k = norm(m.nome);
      if (!pool[k]) pool[k] = [];
      pool[k].push(m);
    });

    const usedIds = new Set<string>();
    const now = Date.now();
    const final: Membro[] = [];
    let updated = 0;
    let added = 0;

    records.forEach((r: any) => {
      const k = norm(r.nome);
      const candidates = pool[k] || [];
      const match = candidates.find(m => !usedIds.has(m.id));

      if (match) {
        usedIds.add(match.id);
        updated++;
        final.push({ ...match, ...r, id: match.id, atualizadoEm: now });
      } else {
        added++;
        final.push({ id: newMemId(), ...r, atualizadoEm: now });
      }
    });

    if (!removeUnlisted) {
      existingMembers.forEach(m => {
        if (!usedIds.has(m.id)) {
          final.push(m);
        }
      });
    }

    final.sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt'));

    // Chunk into batches of 250
    const CHUNK_SIZE = 250;
    const newChunks: Membro[][] = [];
    for (let i = 0; i < final.length; i += CHUNK_SIZE) {
      newChunks.push(final.slice(i, i + CHUNK_SIZE));
    }

    for (let i = 0; i < newChunks.length; i++) {
      await db.doc(`conf/b/membros/lista-${i}`).set({ membros: newChunks[i] });
    }

    // Delete unused old chunks
    for (const oldId of oldChunkIds) {
      const chunkIndex = parseInt(oldId.split('-')[1], 10);
      if (isNaN(chunkIndex) || chunkIndex >= newChunks.length) {
        await db.doc(`conf/b/membros/${oldId}`).delete();
      }
    }

    const hasChamado = final.some(m => Boolean(m.chamado && m.chamado.trim()));
    const meta: MembroMeta = {
      importadoEm: now,
      total: final.length,
      temChamado: hasChamado,
    };
    await db.doc('conf/b/membros/meta').set(meta);

    res.json({
      success: true,
      total: final.length,
      updated,
      added,
      deleted: removeUnlisted ? existingMembers.length - updated : 0,
    });
  } catch (error) {
    console.error('Error during bulk import of membros:', error);
    res.status(500).json({ error: 'Erro ao processar importação.' });
  }
});

export default router;
