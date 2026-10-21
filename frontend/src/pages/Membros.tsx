import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Membro, MembroMeta, Organizacao, MembroProfile360 } from '../types';
import { parseMembersHtml } from '../utils/membersParser';

const CH_FLOW = ['Indicado', 'Aprovação do bispado', 'Entrevista', 'Apoio na sacramental', 'Designação'];
const D_FLOW = ['Conversar com a pessoa', 'Desobrigar na sacramental', 'Atualizar no LCR'];

const norm = (s: any) =>
  String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const Membros: React.FC = () => {
  const navigate = useNavigate();
  const { isBishopric, canWrite } = useAuth();
  const [members, setMembers] = useState<Membro[]>([]);
  const [suborgs, setSuborgs] = useState<Organizacao[]>([]);
  const [meta, setMeta] = useState<MembroMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Drawer 360 states
  const [drawerMember, setDrawerMember] = useState<Membro | null>(null);
  const [profile360, setProfile360] = useState<MembroProfile360 | null>(null);
  const [loading360, setLoading360] = useState(false);
  const [quickTaskTitulo, setQuickTaskTitulo] = useState('');
  const [isAddingQuickTask, setIsAddingQuickTask] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'todos' | 'M' | 'F'>('todos');
  const [categoryFilter, setCategoryFilter] = useState<'todos' | 'adultos' | 'jovens' | 'criancas' | 'semchamado'>('todos');
  const [limit, setLimit] = useState(60);

  // Single Member Form Modal
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Membro | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formSexo, setFormSexo] = useState<'M' | 'F' | ''>('');
  const [formNascimento, setFormNascimento] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEndereco, setFormEndereco] = useState('');
  const [formChamado, setFormChamado] = useState('');
  const [formObs, setFormObs] = useState('');

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [flipNames, setFlipNames] = useState(false);
  const [removeUnlisted, setRemoveUnlisted] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [isBishopric]);

  async function loadMembers() {
    try {
      const [membersRes, orgsRes] = await Promise.all([
        api.get<{ members: Membro[]; meta: MembroMeta }>('/membros'),
        api.get<Organizacao[]>('/chamados/organizacoes').catch(() => []),
      ]);
      setMembers(membersRes.members || []);
      setMeta(membersRes.meta || null);
      setSuborgs(orgsRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openNewMemberModal() {
    setEditingMember(null);
    setFormNome('');
    setFormSexo('');
    setFormNascimento('');
    setFormTelefone('');
    setFormEmail('');
    setFormEndereco('');
    setFormChamado('');
    setFormObs('');
    setIsMemberModalOpen(true);
  }

  function openEditMemberModal(m: Membro) {
    setEditingMember(m);
    setFormNome(m.nome);
    setFormSexo(m.sexo || '');
    setFormNascimento(m.nascimento || '');
    setFormTelefone(m.telefone || '');
    setFormEmail(m.email || '');
    setFormEndereco(m.endereco || '');
    setFormChamado(m.chamado || '');
    setFormObs(m.obs || '');
    setIsMemberModalOpen(true);
  }

  async function handleMemberSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formNome.trim()) return alert('O nome é obrigatório.');

    try {
      const payload = {
        nome: formNome,
        sexo: formSexo,
        nascimento: formNascimento,
        telefone: formTelefone,
        email: formEmail,
        endereco: formEndereco,
        chamado: formChamado,
        obs: formObs,
      };

      if (editingMember) {
        await api.put(`/membros/${editingMember.id}`, payload);
      } else {
        await api.post('/membros', payload);
      }

      setIsMemberModalOpen(false);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar membro');
    }
  }

  async function handleMemberDelete(id: string) {
    if (!confirm('Deseja excluir este membro da lista?')) return;
    try {
      await api.delete(`/membros/${id}`);
      setIsMemberModalOpen(false);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir membro');
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPasteData(content);
      }
    };
    reader.readAsText(file);
  }

  // Raw text, TSV/CSV or HTML parser
  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteData.trim()) return alert('Selecione um arquivo ou cole os dados.');

    setImporting(true);
    try {
      let parsedRecords: any[] = [];

      // Check if user pasted/loaded HTML from LCR
      if (pasteData.includes('<tr') || pasteData.includes('cloned-column-header') || pasteData.includes('<table')) {
        parsedRecords = parseMembersHtml(pasteData);
      } else {
        const lines = pasteData.trim().split('\n');
        const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';

        // Check if header row is present
        const hasHeader = lines[0].toLowerCase().includes('nome');
        const dataLines = hasHeader ? lines.slice(1) : lines;

        parsedRecords = dataLines
          .map(line => {
            const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
            let nome = cols[0] || '';
            if (flipNames && nome.includes(',')) {
              const parts = nome.split(',');
              if (parts.length === 2) nome = `${parts[1].trim()} ${parts[0].trim()}`;
            }
            if (!nome || nome.toLowerCase() === 'nome') return null;

            return {
              nome,
              sexo: cols[1]?.startsWith('M') ? 'M' : cols[1]?.startsWith('F') ? 'F' : '',
              nascimento: cols[2] || '',
              telefone: cols[3] || '',
              email: cols[4] && cols[4].includes('@') ? cols[4] : '',
              chamado: cols[4] && !cols[4].includes('@') ? cols[4] : '',
              idade: cols[5] ? Number(cols[5]) : undefined,
              nomeOriginal: cols[6] || undefined,
            };
          })
          .filter(Boolean);
      }

      if (!parsedRecords.length) {
        alert('Nenhum registro válido encontrado. Verifique o formato do arquivo.');
        setImporting(false);
        return;
      }

      const res = await api.post('/membros/import', {
        records: parsedRecords,
        removeUnlisted,
      });

      alert(`Importação concluída com sucesso! ${res.total} membros na lista.`);
      setIsImportModalOpen(false);
      setPasteData('');
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Erro na importação de membros');
    } finally {
      setImporting(false);
    }
  }

  const ageOf = (m: Membro) => {
    if (m.nascimento && /^\d{4}-\d{2}-\d{2}$/.test(m.nascimento)) {
      const [y, mm, d] = m.nascimento.split('-').map(Number);
      const b = new Date(y, mm - 1, d);
      const n = new Date();
      let a = n.getFullYear() - b.getFullYear();
      if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
      return a;
    }
    const i = parseInt(String(m.idade || ''), 10);
    return isFinite(i) ? i : null;
  };

  const ageGroup = (m: Membro) => {
    const a = ageOf(m);
    if (a == null) return '';
    if (a < 12) return 'criancas';
    if (a < 18) return 'jovens';
    return 'adultos';
  };

  // Active callings map across ward organizations
  const activeCallingsMap = useMemo(() => {
    const map: Record<string, { suborgId: string; suborgNome: string; orgGrupo: string; cargoId: string; cargoTitulo: string; desde?: string }[]> = {};
    suborgs.forEach(org => {
      (org.cargos || []).forEach(c => {
        if (c.pessoa) {
          const k = norm(c.pessoa);
          if (!map[k]) map[k] = [];
          map[k].push({
            suborgId: org.id,
            suborgNome: org.nome,
            orgGrupo: org.grupo || 'Outros',
            cargoId: c.id,
            cargoTitulo: c.titulo,
            desde: c.desde,
          });
        }
      });
    });
    return map;
  }, [suborgs]);

  const getMemberActiveCallings = (m: Membro) => {
    return activeCallingsMap[norm(m.nome)] || [];
  };

  const hasAnyCalling = (m: Membro) => {
    const active = getMemberActiveCallings(m);
    return active.length > 0 || Boolean(m.chamado && m.chamado.trim());
  };

  async function openDrawer(m: Membro) {
    setDrawerMember(m);
    setLoading360(true);
    setProfile360(null);
    setIsAddingQuickTask(false);
    setQuickTaskTitulo('');
    try {
      const res = await api.get<MembroProfile360>(`/membros/${m.id}/profile360`);
      setProfile360(res);
    } catch (err) {
      console.error('Erro ao carregar perfil 360:', err);
    } finally {
      setLoading360(false);
    }
  }

  async function handleToggleTaskStatus(taskId: string, currentStatus: string, origem: 'bispado' | 'conselho') {
    try {
      const nextStatus = currentStatus === 'concluida' ? 'pendente' : 'concluida';
      await api.put(`/designacoes/${taskId}`, {
        status: nextStatus,
        currentOrigin: origem,
      });
      if (drawerMember) {
        const res = await api.get<MembroProfile360>(`/membros/${drawerMember.id}/profile360`);
        setProfile360(res);
      }
    } catch (err) {
      console.error('Erro ao atualizar status da tarefa:', err);
    }
  }

  async function handleAddQuickTask(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTaskTitulo.trim() || !drawerMember) return;
    try {
      await api.post('/designacoes', {
        titulo: quickTaskTitulo.trim(),
        responsavel: drawerMember.nome,
        origem: isBishopric ? 'bispado' : 'conselho',
        status: 'pendente',
      });
      setQuickTaskTitulo('');
      setIsAddingQuickTask(false);
      const res = await api.get<MembroProfile360>(`/membros/${drawerMember.id}/profile360`);
      setProfile360(res);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar designação');
    }
  }

  if (!isBishopric) {
    return <div className="notice bisp">Acesso restrito aos membros do Bispado.</div>;
  }

  if (loading) {
    return <div className="empty">Carregando lista de membros…</div>;
  }

  const totalAdultos = members.filter(m => ageGroup(m) === 'adultos').length;
  const totalJovens = members.filter(m => ageGroup(m) === 'jovens').length;
  const totalCriancas = members.filter(m => ageGroup(m) === 'criancas').length;
  const semChamado = members.filter(m => ageGroup(m) === 'adultos' && !hasAnyCalling(m)).length;

  const q = search.toLowerCase().trim();
  const filtered = members.filter(m => {
    if (genderFilter !== 'todos' && m.sexo !== genderFilter) return false;
    if (categoryFilter === 'adultos' && ageGroup(m) !== 'adultos') return false;
    if (categoryFilter === 'jovens' && ageGroup(m) !== 'jovens') return false;
    if (categoryFilter === 'criancas' && ageGroup(m) !== 'criancas') return false;
    if (categoryFilter === 'semchamado' && (ageGroup(m) !== 'adultos' || hasAnyCalling(m))) return false;
    if (q) {
      const activeTitles = getMemberActiveCallings(m).map(c => `${c.cargoTitulo} ${c.suborgNome}`).join(' ');
      const txt = `${m.nome} ${m.chamado || ''} ${activeTitles} ${m.telefone || ''}`.toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Membros</h2>
          <p className="sub">
            Lista da ala para acompanhamento e indicação de chamados. Somente o bispado vê esta página.
          </p>
        </div>
        {canWrite && (
          <div className="btns">
            <button type="button" className="btn bisp" onClick={() => setIsImportModalOpen(true)}>
              Importar lista
            </button>
            <button type="button" className="btn" onClick={openNewMemberModal}>
              + Membro
            </button>
          </div>
        )}
      </div>

      <div className="stats">
        <div className="stat">
          <div className="v num">{members.length}</div>
          <div className="l">membros na lista</div>
          <div className="x">{meta?.total ? `total: ${meta.total}` : 'cadastro regular'}</div>
        </div>

        <div className="stat">
          <div className="v num">{totalAdultos}</div>
          <div className="l">adultos</div>
          <div className="x">{totalJovens} jovens · {totalCriancas} crianças</div>
        </div>

        <div className="stat">
          <div className="v num">{semChamado}</div>
          <div className="l">adultos sem chamado</div>
          <div className="x">possíveis indicações</div>
        </div>
      </div>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="searchbar">
          <input
            className="inp"
            type="search"
            placeholder="Buscar por nome, chamado ou telefone"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="chips">
            {(
              [
                ['todos', 'Todos'],
                ['M', 'Homens'],
                ['F', 'Mulheres'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`chip ${genderFilter === val ? 'on' : ''}`}
                onClick={() => setGenderFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="chips">
          {(
            [
              ['todos', 'Todos', members.length],
              ['adultos', 'Adultos', totalAdultos],
              ['jovens', 'Jovens 12–17', totalJovens],
              ['criancas', 'Crianças', totalCriancas],
              ['semchamado', 'Adultos sem chamado', semChamado],
            ] as const
          ).map(([val, label, n]) => (
            <button
              key={val}
              type="button"
              className={`chip ${categoryFilter === val ? 'on' : ''}`}
              onClick={() => setCategoryFilter(val)}
            >
              {label} <span className="c num">{n}</span>
            </button>
          ))}
        </div>

        {filtered.length ? (
          <div className="list">
            {filtered.slice(0, limit).map(m => {
              const age = ageOf(m);
              const activeCallings = getMemberActiveCallings(m);
              return (
                <div
                  key={m.id}
                  className="row member-clickable-row"
                  onClick={() => openDrawer(m)}
                  title="Clique para abrir a Ficha 360° deste membro"
                >
                  <div className="row-main">
                    <div className="row-t" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600 }}>{m.nome}</span>
                      {m.nomeOriginal && m.nomeOriginal !== m.nome && (
                        <span style={{ color: 'var(--muted)', fontSize: '11.5px', fontWeight: 'normal' }}>
                          ({m.nomeOriginal})
                        </span>
                      )}
                    </div>
                    <div className="row-m" style={{ alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {age != null && <span>{age} anos</span>}
                      {m.sexo && <span>{m.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>}
                      {m.nascimento && <span>📅 {m.nascimento}</span>}
                      {m.telefone && (
                        <span onClick={e => e.stopPropagation()}>
                          <a href={`tel:${m.telefone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            📞 {m.telefone}
                          </a>
                        </span>
                      )}
                      {m.email && (
                        <span onClick={e => e.stopPropagation()}>
                          <a href={`mailto:${m.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            ✉️ {m.email}
                          </a>
                        </span>
                      )}
                      {/* Badges de Chamados Conectados à Lista */}
                      <div className="badge-calling-container">
                        {activeCallings.length > 0 ? (
                          activeCallings.map(c => (
                            <span key={c.cargoId} className="badge-calling" title={`Organização: ${c.suborgNome}`}>
                              👑 {c.cargoTitulo} <span className="badge-org">· {c.suborgNome}</span>
                            </span>
                          ))
                        ) : m.chamado?.trim() ? (
                          <span className="badge-calling badge-calling-legacy" title="Registrado no cadastro">
                            📋 {m.chamado}
                          </span>
                        ) : (
                          <span className="badge-sem-chamado">Sem chamado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="acts" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn sm btn-360"
                      onClick={() => openDrawer(m)}
                      title="Abrir ficha 360° com histórico, chamados e designações"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Ficha 360°
                    </button>
                    {canWrite && (
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => openEditMemberModal(m)}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty" style={{ marginBlock: 12 }}>
            Nenhum membro encontrado com os filtros selecionados.
          </div>
        )}

        {filtered.length > limit && (
          <button
            type="button"
            className="btn ghost sm"
            style={{ marginTop: 8 }}
            onClick={() => setLimit(l => l + 60)}
          >
            Mostrar mais ({filtered.length - limit} restantes)
          </button>
        )}
      </section>

      {/* Drawer: Ficha 360° do Membro */}
      {drawerMember && (
        <div className="drawer-backdrop" onClick={() => setDrawerMember(null)}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="drawer-header">
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setDrawerMember(null)}
                title="Fechar ficha"
              >
                ✕
              </button>

              <div className="drawer-profile-top">
                <div className={`drawer-avatar ${drawerMember.sexo === 'F' ? 'fem' : ''}`}>
                  {drawerMember.nome
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(p => p[0].toUpperCase())
                    .join('')}
                </div>

                <div className="drawer-user-info">
                  <h3>{drawerMember.nome}</h3>
                  {drawerMember.nomeOriginal && drawerMember.nomeOriginal !== drawerMember.nome && (
                    <div className="sub-name">Nome original: {drawerMember.nomeOriginal}</div>
                  )}
                  <div className="drawer-chips">
                    {ageOf(drawerMember) != null && (
                      <span className="drawer-chip highlight">{ageOf(drawerMember)} anos</span>
                    )}
                    {drawerMember.sexo && (
                      <span className="drawer-chip">
                        {drawerMember.sexo === 'M' ? 'Masculino' : 'Feminino'}
                      </span>
                    )}
                    <span className="drawer-chip">
                      {ageGroup(drawerMember) === 'adultos'
                        ? 'Adulto'
                        : ageGroup(drawerMember) === 'jovens'
                        ? 'Jovem'
                        : 'Criança'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Contact Bar */}
              <div className="drawer-contact-bar">
                {drawerMember.telefone && (
                  <>
                    <a
                      href={`tel:${drawerMember.telefone.replace(/\D/g, '')}`}
                      className="contact-action-btn"
                    >
                      📞 Ligar
                    </a>
                    <a
                      href={`https://wa.me/55${drawerMember.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá, ${drawerMember.nome.split(' ')[0]}!`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="contact-action-btn whatsapp"
                    >
                      💬 WhatsApp
                    </a>
                  </>
                )}
                {drawerMember.email && (
                  <a href={`mailto:${drawerMember.email}`} className="contact-action-btn">
                    ✉️ E-mail
                  </a>
                )}
              </div>
            </div>

            {/* Drawer Body */}
            <div className="drawer-body">
              {loading360 ? (
                <div className="empty" style={{ margin: 'auto' }}>
                  Carregando ficha 360° do membro…
                </div>
              ) : (
                <>
                  {/* 1. Chamados Atuais */}
                  <div className="drawer-section">
                    <div className="drawer-section-title">
                      <span>Chamados Ativos na Ala</span>
                      <span className="count-badge">
                        {profile360?.chamadosAtivos.length || (drawerMember.chamado ? 1 : 0)}
                      </span>
                    </div>

                    {profile360?.chamadosAtivos && profile360.chamadosAtivos.length > 0 ? (
                      profile360.chamadosAtivos.map(c => (
                        <div key={c.cargoId} className="drawer-card drawer-card-calling">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className="calling-title">👑 {c.cargoTitulo}</div>
                            <span className="badge-calling" style={{ fontSize: '10.5px' }}>Oficial</span>
                          </div>
                          <div className="calling-meta">
                            <span>📁 <b>Organização:</b> {c.suborgNome}</span>
                            {c.desde && <span>📅 <b>Desde:</b> {c.desde}</span>}
                          </div>
                          {canWrite && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                              <button
                                type="button"
                                className="btn ghost sm"
                                onClick={() => navigate('/chamados')}
                              >
                                Ver na lista
                              </button>
                              <button
                                type="button"
                                className="btn ghost sm"
                                style={{ color: '#f43f5e' }}
                                onClick={() =>
                                  navigate(
                                    `/chamados-desobrigacoes?openDesobrigar=true&pessoaNome=${encodeURIComponent(
                                      drawerMember.nome
                                    )}&cargo=${encodeURIComponent(c.cargoTitulo)}&orgId=${c.suborgId}&cargoId=${c.cargoId}`
                                  )
                                }
                              >
                                Desobrigar
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : drawerMember.chamado?.trim() ? (
                      <div className="drawer-card drawer-card-calling">
                        <div className="calling-title">📋 {drawerMember.chamado}</div>
                        <div className="calling-meta">
                          <span>(Registrado no cadastro importado)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state-card">
                        Nenhum chamado ativo no momento. Membro disponível para novas indicações.
                      </div>
                    )}
                  </div>

                  {/* 2. Processos em Andamento (Pipeline) */}
                  <div className="drawer-section">
                    <div className="drawer-section-title">
                      <span>Processos no Pipeline</span>
                      <span className="count-badge">
                        {profile360?.processosPipeline.length || 0}
                      </span>
                    </div>

                    {profile360?.processosPipeline && profile360.processosPipeline.length > 0 ? (
                      profile360.processosPipeline.map(proc => {
                        const isChamado = proc.tipo === 'chamado' && proc.detalhe !== 'Desobrigação';
                        const stages = isChamado ? CH_FLOW : D_FLOW;
                        const currentIdx = stages.indexOf(proc.detalhe);
                        const activeIdx = currentIdx >= 0 ? currentIdx : (proc.dpasso ?? 0);

                        return (
                          <div key={proc.id} className="pipeline-step-box">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <b style={{ fontSize: '13.5px', color: '#38bdf8' }}>
                                {isChamado ? 'Indicação de Chamado' : 'Processo de Desobrigação'}
                              </b>
                              <span className="drawer-chip highlight">{proc.detalhe || 'Em andamento'}</span>
                            </div>
                            <div style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
                              <b>Cargo:</b> {proc.chamado || 'Não especificado'}
                            </div>
                            {proc.proxima && (
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                👉 <b>Próximo passo:</b> {proc.proxima} ({proc.responsavel || 'Bispo'})
                              </div>
                            )}

                            {/* Visual Stepper */}
                            <div className="pipeline-stepper">
                              {stages.map((st, sIdx) => {
                                const isDone = sIdx < activeIdx;
                                const isCur = sIdx === activeIdx;
                                return (
                                  <div
                                    key={st}
                                    className={`stepper-node ${isDone ? 'done' : ''} ${isCur ? 'active' : ''}`}
                                    title={st}
                                  >
                                    {isDone ? '✓' : sIdx + 1}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="stepper-labels">
                              <span>{stages[0]}</span>
                              <span>{stages[Math.floor(stages.length / 2)]}</span>
                              <span>{stages[stages.length - 1]}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-state-card">
                        Nenhum processo de indicação ou transição em aberto para este membro.
                      </div>
                    )}
                  </div>

                  {/* 3. Designações / Tarefas */}
                  <div className="drawer-section">
                    <div className="drawer-section-title">
                      <span>Designações Atribuídas</span>
                      <span className="count-badge">
                        {profile360?.designacoes.length || 0}
                      </span>
                    </div>

                    {profile360?.designacoes && profile360.designacoes.length > 0 ? (
                      profile360.designacoes.map(d => (
                        <div key={d.id} className={`task-item-drawer ${d.status}`}>
                          <input
                            type="checkbox"
                            className="task-checkbox"
                            checked={d.status === 'concluida'}
                            onChange={() => handleToggleTaskStatus(d.id, d.status, d.origem)}
                            title="Marcar como concluída / pendente"
                          />
                          <div className="task-info">
                            <span className="task-title">{d.titulo}</span>
                            <div className="task-meta">
                              {d.prazo && <span>📅 Prazo: {d.prazo}</span>}
                              <span>📌 {d.origem === 'bispado' ? 'Bispado' : 'Conselho da Ala'}</span>
                              <span style={{ color: d.status === 'concluida' ? '#10b981' : '#f59e0b' }}>
                                {d.status === 'concluida' ? 'Concluída' : 'Pendente'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state-card">
                        Nenhuma tarefa ou designação atribuída atualmente.
                      </div>
                    )}

                    {canWrite && !isAddingQuickTask && (
                      <button
                        type="button"
                        className="btn ghost sm"
                        style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                        onClick={() => setIsAddingQuickTask(true)}
                      >
                        + Atribuir nova tarefa
                      </button>
                    )}

                    {canWrite && isAddingQuickTask && (
                      <form onSubmit={handleAddQuickTask} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <input
                          type="text"
                          className="inp"
                          placeholder="Título da tarefa para este membro..."
                          value={quickTaskTitulo}
                          onChange={e => setQuickTaskTitulo(e.target.value)}
                          autoFocus
                        />
                        <button type="submit" className="btn sm">Salvar</button>
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => {
                            setIsAddingQuickTask(false);
                            setQuickTaskTitulo('');
                          }}
                        >
                          Cancelar
                        </button>
                      </form>
                    )}
                  </div>

                  {/* 4. Histórico de Chamados */}
                  <div className="drawer-section">
                    <div className="drawer-section-title">
                      <span>Histórico de Chamados Servidos</span>
                      <span className="count-badge">
                        {profile360?.historicoChamados.length || 0}
                      </span>
                    </div>

                    {profile360?.historicoChamados && profile360.historicoChamados.length > 0 ? (
                      <div className="history-timeline">
                        {profile360.historicoChamados.map((h, hIdx) => (
                          <div key={hIdx} className="history-item">
                            <div className="hist-title">{h.cargoTitulo}</div>
                            <div className="hist-sub">
                              {h.suborgNome} · {h.desde ? `de ${h.desde}` : ''} {h.ate ? `até ${h.ate}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state-card">
                        Nenhum histórico anterior registrado para este membro.
                      </div>
                    )}
                  </div>

                  {/* 5. Dados Cadastrais Adicionais */}
                  <div className="drawer-section">
                    <div className="drawer-section-title">
                      <span>Dados de Cadastro</span>
                    </div>
                    <div className="drawer-card" style={{ fontSize: '12.5px', color: '#cbd5e1', gap: '6px' }}>
                      {drawerMember.nascimento && (
                        <div>🎂 <b>Data de Nascimento:</b> {drawerMember.nascimento}</div>
                      )}
                      {drawerMember.endereco && (
                        <div>📍 <b>Endereço:</b> {drawerMember.endereco}</div>
                      )}
                      {drawerMember.obs && (
                        <div>📝 <b>Observações:</b> {drawerMember.obs}</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="drawer-footer">
              {canWrite && (
                <button
                  type="button"
                  className="btn bisp"
                  onClick={() =>
                    navigate(
                      `/chamados-desobrigacoes?openIndicar=true&pessoaNome=${encodeURIComponent(drawerMember.nome)}`
                    )
                  }
                >
                  + Indicar para chamado
                </button>
              )}
              {canWrite && (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    const m = drawerMember;
                    setDrawerMember(null);
                    openEditMemberModal(m);
                  }}
                >
                  Editar cadastro
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar / Editar Membro */}
      {isMemberModalOpen && (
        <div className="modal" onClick={() => setIsMemberModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>{editingMember ? 'Editar membro' : 'Novo membro'}</h3>
            <form onSubmit={handleMemberSubmit} className="form">
              <div className="field">
                <label>Nome completo *</label>
                <input
                  className="inp"
                  value={formNome}
                  onChange={e => setFormNome(e.target.value)}
                  required
                />
              </div>

              <div className="two">
                <div className="field">
                  <label>Sexo</label>
                  <select
                    className="inp"
                    value={formSexo}
                    onChange={e => setFormSexo(e.target.value as any)}
                  >
                    <option value="">—</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>

                <div className="field">
                  <label>Data de nascimento</label>
                  <input
                    className="inp"
                    type="date"
                    value={formNascimento}
                    onChange={e => setFormNascimento(e.target.value)}
                  />
                </div>
              </div>

              <div className="two">
                <div className="field">
                  <label>Telefone</label>
                  <input
                    className="inp"
                    value={formTelefone}
                    onChange={e => setFormTelefone(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>E-mail</label>
                  <input
                    className="inp"
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>Chamado atual</label>
                <input
                  className="inp"
                  value={formChamado}
                  onChange={e => setFormChamado(e.target.value)}
                  placeholder="Deixe em branco se não tiver chamado"
                />
              </div>

              <div className="field">
                <label>Endereço</label>
                <input
                  className="inp"
                  value={formEndereco}
                  onChange={e => setFormEndereco(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Observações</label>
                <textarea
                  className="inp"
                  value={formObs}
                  onChange={e => setFormObs(e.target.value)}
                />
              </div>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Salvar
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsMemberModalOpen(false)}>
                    Cancelar
                  </button>
                </div>

                {editingMember && (
                  <button
                    type="button"
                    className="btn ghost danger"
                    onClick={() => handleMemberDelete(editingMember.id)}
                  >
                    Excluir
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Importar Lista */}
      {isImportModalOpen && (
        <div className="modal" onClick={() => setIsImportModalOpen(false)}>
          <div className="sheet wide" onClick={e => e.stopPropagation()}>
            <h3>Importar lista de membros</h3>
            <p className="sub" style={{ marginTop: -8 }}>
              Suporta arquivos <b>Members.html</b> do LCR, planilhas CSV ou linhas copiadas do Excel (TSV).
            </p>

            <form onSubmit={handleImportSubmit} className="form" style={{ marginTop: 12 }}>
              <div className="field">
                <label>Carregar arquivo do computador (HTML, CSV ou TSV)</label>
                <input
                  type="file"
                  accept=".html,.htm,.csv,.tsv,.txt"
                  className="inp"
                  onChange={handleFileSelected}
                />
              </div>

              <div className="field">
                <label>Ou cole os dados diretamente aqui</label>
                <textarea
                  className="inp"
                  style={{ minHeight: 140, fontFamily: 'monospace', fontSize: 12.5 }}
                  value={pasteData}
                  onChange={e => setPasteData(e.target.value)}
                  placeholder="Cole aqui o conteúdo de Members.html ou linhas copiadas do Excel/CSV..."
                  required
                />
              </div>

              <label className="chk">
                <input
                  type="checkbox"
                  checked={flipNames}
                  onChange={e => setFlipNames(e.target.checked)}
                />
                Converter &ldquo;Sobrenome, Nome&rdquo; para &ldquo;Nome Sobrenome&rdquo;
              </label>

              <label className="chk">
                <input
                  type="checkbox"
                  checked={removeUnlisted}
                  onChange={e => setRemoveUnlisted(e.target.checked)}
                />
                Remover da lista quem não estiver neste arquivo
              </label>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri" disabled={importing}>
                    {importing ? 'Importando…' : 'Processar importação'}
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsImportModalOpen(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
