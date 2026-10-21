import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Pessoa, Organizacao, Cargo, Membro } from '../types';
import { Icon } from '../components/Icons';

const CH_FLOW = ['Indicado', 'Aprovação do bispado', 'Entrevista', 'Apoio na sacramental', 'Designação'];
const D_FLOW = ['Conversar com a pessoa', 'Desobrigar na sacramental', 'Atualizar no LCR'];

export const ChamadosDesobrigacoes: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [suborgs, setSuborgs] = useState<Organizacao[]>([]);
  const [members, setMembers] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'novos' | 'desob' | 'vagos' | 'feitos'>('novos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<'chamado' | 'desob'>('chamado');

  // Form states
  const [nome, setNome] = useState('');
  const [chamado, setChamado] = useState('');
  const [selectedCargoRef, setSelectedCargoRef] = useState<{ org: string; cargo: string } | null>(null);
  const [proxima, setProxima] = useState('');
  const [responsavel, setResponsavel] = useState('Bispo');
  const [prazo, setPrazo] = useState('');
  const [obs, setObs] = useState('');
  const [memberSearchFilter, setMemberSearchFilter] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadAllData().then(() => {
      const openIndicar = searchParams.get('openIndicar');
      const openDesob = searchParams.get('openDesobrigar');
      const pessoaNome = searchParams.get('pessoaNome') || '';
      const cargoParam = searchParams.get('cargo') || '';
      const orgId = searchParams.get('orgId') || '';
      const cargoId = searchParams.get('cargoId') || '';

      if (openIndicar === 'true') {
        setModalTipo('chamado');
        setNome(pessoaNome);
        setChamado(cargoParam);
        if (orgId && cargoId) setSelectedCargoRef({ org: orgId, cargo: cargoId });
        setProxima('Entrevista com o bispado');
        setIsModalOpen(true);
        setSearchParams({}, { replace: true });
      } else if (openDesob === 'true') {
        setModalTipo('desob');
        setNome(pessoaNome);
        setChamado(cargoParam);
        if (orgId && cargoId) setSelectedCargoRef({ org: orgId, cargo: cargoId });
        setProxima('Conversar com a pessoa');
        setIsModalOpen(true);
        setSearchParams({}, { replace: true });
      }
    });
  }, [isBishopric]);

  async function loadAllData() {
    try {
      await Promise.all([loadPessoas(), loadSubOrgs(), loadMembers()]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPessoas() {
    try {
      const data = await api.get<Pessoa[]>('/pessoas?tipo=chamado');
      setPessoas(data);
    } catch (err) {
      console.error('Erro ao carregar pessoas:', err);
    }
  }

  async function loadSubOrgs() {
    try {
      const data = await api.get<Organizacao[]>('/chamados/organizacoes');
      setSuborgs(data);
    } catch (err) {
      console.error('Erro ao carregar chamados:', err);
    }
  }

  async function loadMembers() {
    try {
      const res = await api.get<{ members: Membro[] }>('/membros');
      setMembers(res.members || []);
    } catch (err) {
      console.debug('Membros não puderam ser carregados:', err);
    }
  }

  // Lookup map of members already serving
  const memberCallingsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    suborgs.forEach(org => {
      (org.cargos || []).forEach(c => {
        if (c.pessoa) {
          const k = c.pessoa.toLowerCase().trim();
          if (!map[k]) map[k] = [];
          map[k].push(`${c.titulo} (${org.nome})`);
        }
      });
    });
    return map;
  }, [suborgs]);

  // List of vacant callings across the ward
  const vagasList = useMemo(() => {
    const list: {
      orgId: string;
      orgNome: string;
      orgGrupo: string;
      cargo: Cargo;
    }[] = [];

    suborgs.forEach(org => {
      (org.cargos || []).forEach(c => {
        if (!c.pessoa && !c.fixo) {
          list.push({
            orgId: org.id,
            orgNome: org.nome,
            orgGrupo: org.grupo || 'Outros',
            cargo: c,
          });
        }
      });
    });

    return list;
  }, [suborgs]);

  // List of occupied callings (for release flow)
  const occupiedCallingsList = useMemo(() => {
    const list: {
      orgId: string;
      orgNome: string;
      cargo: Cargo;
    }[] = [];

    suborgs.forEach(org => {
      (org.cargos || []).forEach(c => {
        if (c.pessoa) {
          list.push({
            orgId: org.id,
            orgNome: org.nome,
            cargo: c,
          });
        }
      });
    });

    return list;
  }, [suborgs]);

  // Filter members for modal
  const filteredMembers = useMemo(() => {
    const q = memberSearchFilter.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      m => m.nome.toLowerCase().includes(q) || (m.nomeOriginal && m.nomeOriginal.toLowerCase().includes(q))
    );
  }, [memberSearchFilter, members]);

  function openModal(type: 'chamado' | 'desob', presetCargo?: { orgId: string; orgNome: string; cargo: Cargo }) {
    setModalTipo(type);
    setMemberSearchFilter('');
    setResponsavel('Bispo');
    setPrazo('');
    setObs('');

    if (presetCargo) {
      if (type === 'chamado') {
        setNome('');
        setChamado(`${presetCargo.cargo.titulo} (${presetCargo.orgNome})`);
        setSelectedCargoRef({ org: presetCargo.orgId, cargo: presetCargo.cargo.id });
        setProxima('Entrevista com o bispado');
      } else {
        setNome(presetCargo.cargo.pessoa || '');
        setChamado(`${presetCargo.cargo.titulo} (${presetCargo.orgNome})`);
        setSelectedCargoRef({ org: presetCargo.orgId, cargo: presetCargo.cargo.id });
        setProxima('Conversar com a pessoa');
      }
    } else {
      setNome('');
      setChamado('');
      setSelectedCargoRef(null);
      setProxima(type === 'chamado' ? 'Entrevista com o bispado' : 'Conversar com a pessoa');
    }

    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return alert('O nome é obrigatório.');

    try {
      await api.post('/pessoas', {
        nome: nome.trim(),
        tipo: 'chamado',
        detalhe: modalTipo === 'chamado' ? 'Indicado' : 'Desobrigação',
        chamado: chamado.trim(),
        proxima,
        responsavel,
        prazo,
        obs,
        cargoRef: selectedCargoRef,
      });

      setIsModalOpen(false);
      await Promise.all([loadPessoas(), loadSubOrgs()]);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar');
    }
  }

  async function handleAdvanceChamado(id: string) {
    if (!canWrite) return;
    try {
      await api.post(`/pessoas/${id}/advance-chamado`);
      await Promise.all([loadPessoas(), loadSubOrgs()]);
    } catch (err: any) {
      alert(err.message || 'Erro ao avançar etapa');
    }
  }

  async function handleAdvanceDesob(id: string) {
    if (!canWrite) return;
    try {
      await api.post(`/pessoas/${id}/advance-desobrigacao`);
      await Promise.all([loadPessoas(), loadSubOrgs()]);
    } catch (err: any) {
      alert(err.message || 'Erro ao avançar desobrigação');
    }
  }

  async function handleReopen(id: string) {
    if (!canWrite) return;
    try {
      await api.post(`/pessoas/${id}/toggle`);
      await Promise.all([loadPessoas(), loadSubOrgs()]);
    } catch (err: any) {
      alert(err.message || 'Erro ao reabrir');
    }
  }

  async function handleCancel(id: string, nomeItem?: string, isDesobrigacao?: boolean) {
    if (!canWrite) return;
    const itemTipo = isDesobrigacao ? 'a desobrigação' : 'o chamado';
    const confirmMsg = nomeItem
      ? `Tem certeza que deseja cancelar ${itemTipo} de "${nomeItem}"?`
      : `Tem certeza que deseja cancelar ${itemTipo}?`;

    if (!confirm(confirmMsg)) return;

    try {
      await api.delete(`/pessoas/${id}`);
      await Promise.all([loadPessoas(), loadSubOrgs()]);
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar');
    }
  }

  if (!isBishopric) {
    return <div className="notice bisp">Acesso restrito aos membros do Bispado.</div>;
  }

  if (loading) {
    return <div className="empty">Carregando chamados e desobrigações…</div>;
  }

  const isDes = (p: Pessoa) => p.detalhe === 'Desobrigação';
  const openChamados = pessoas.filter(p => p.status !== 'concluido' && !isDes(p));
  const openDesob = pessoas.filter(p => p.status !== 'concluido' && isDes(p));
  const concluidos = pessoas.filter(p => p.status === 'concluido');
  const lateCount = pessoas.filter(p => p.status !== 'concluido' && p.prazo && p.prazo < today).length;

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Chamados e desobrigações</h2>
          <p className="sub">
            Cada chamado da indicação até a designação, e cada desobrigação até o registro no LCR. Integrado com a Lista de Chamados.
          </p>
        </div>
        {canWrite && (
          <div className="btns">
            <button type="button" className="btn bisp" onClick={() => openModal('chamado')}>
              + Indicar chamado
            </button>
            <button type="button" className="btn" onClick={() => openModal('desob')}>
              + Desobrigação
            </button>
          </div>
        )}
      </div>

      <div className="notice bisp">
        <b>Somente o bispado vê esta página.</b> Nomes indicados ficam em sigilo até o apoio na reunião sacramental.
      </div>

      <div className="kgrid">
        <div className="kcard">
          <h4>Chamados em andamento</h4>
          <div className="kbody">
            <span className="kval">{openChamados.length}</span>
          </div>
          <div className="ksub">
            {openChamados.filter(p => (!p.detalhe || p.detalhe === 'Indicado')).length} aguardando aprovação
          </div>
        </div>

        <div className="kcard">
          <h4>Vagas abertas</h4>
          <div className="kbody">
            <span className={`kval ${vagasList.length ? 's-crit' : ''}`}>{vagasList.length}</span>
          </div>
          <div className="ksub">
            {vagasList.filter(v => v.cargo.pendente).length} com indicação em andamento
          </div>
        </div>

        <div className="kcard">
          <h4>Desobrigações pendentes</h4>
          <div className="kbody">
            <span className={`kval ${openDesob.length ? 's-norm' : ''}`}>{openDesob.length}</span>
          </div>
          <div className="ksub">
            {openDesob.filter(p => Number(p.dpasso || 0) >= 1).length} já conversadas
          </div>
        </div>

        <div className="kcard">
          <h4>Ações vencidas</h4>
          <div className="kbody">
            <span className={`kval ${lateCount ? 's-crit' : 's-exc'}`}>{lateCount}</span>
          </div>
          <div className={`ksub ${lateCount ? 's-crit' : ''}`}>
            {lateCount ? 'prazo passou' : 'tudo em dia'}
          </div>
        </div>
      </div>

      <div className="seg" role="tablist">
        <button
          type="button"
          className={currentView === 'novos' ? 'on' : ''}
          onClick={() => setCurrentView('novos')}
        >
          <Icon name="userplus" /> Chamados novos <span className="num" style={{ opacity: 0.7 }}>{openChamados.length}</span>
        </button>

        <button
          type="button"
          className={currentView === 'vagos' ? 'on' : ''}
          onClick={() => setCurrentView('vagos')}
        >
          <Icon name="flag" /> Vagas na ala <span className="num" style={{ opacity: 0.7 }}>{vagasList.length}</span>
        </button>

        <button
          type="button"
          className={currentView === 'desob' ? 'on' : ''}
          onClick={() => setCurrentView('desob')}
        >
          <Icon name="flag" /> Desobrigações <span className="num" style={{ opacity: 0.7 }}>{openDesob.length}</span>
        </button>

        <button
          type="button"
          className={currentView === 'feitos' ? 'on' : ''}
          onClick={() => setCurrentView('feitos')}
        >
          <Icon name="checks" /> Concluídos <span className="num" style={{ opacity: 0.7 }}>{concluidos.length}</span>
        </button>
      </div>

      {/* Tab: Chamados novos (Pipeline de 5 Etapas) */}
      {currentView === 'novos' && (
        <div className="board">
          {CH_FLOW.map((stage, k) => {
            const stagePessoas = openChamados.filter(p => (!p.detalhe && stage === 'Indicado') || p.detalhe === stage);

            return (
              <section key={stage} className="bcol">
                <header>
                  <span className="bn">{k + 1}</span>
                  <b>{stage}</b>
                  <span className="c num">{stagePessoas.length}</span>
                </header>

                {stagePessoas.length ? (
                  stagePessoas.map(p => {
                    const isOverdue = p.prazo && p.prazo < today;
                    const nextStageIndex = CH_FLOW.indexOf(stage);
                    const nextStageLabel = nextStageIndex < CH_FLOW.length - 1 ? CH_FLOW[nextStageIndex + 1] : 'Concluir chamado';

                    return (
                      <article key={p.id} className={`cdc ${isOverdue ? 'late' : ''}`}>
                        <div className="cdc-n">{p.nome}</div>
                        <div className="cdc-c">{p.chamado || 'Chamado não informado'}</div>
                        {p.proxima && <div className="cdc-m">{p.proxima}</div>}
                        <div className="cdc-m">{p.responsavel || 'Sem responsável'}</div>
                        {canWrite && (
                          <div className="cdc-a">
                            <button
                              type="button"
                              className="btn sm bisp"
                              onClick={() => handleAdvanceChamado(p.id)}
                            >
                              → {nextStageLabel}
                            </button>
                            <button
                              type="button"
                              className="btn ghost sm danger"
                              onClick={() => handleCancel(p.id, p.nome, false)}
                              title="Cancelar chamado"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })
                ) : (
                  <div className="bempty">Ninguém nesta etapa</div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Tab: Vagas Abertas na Ala */}
      {currentView === 'vagos' && (
        <section className="card">
          <div className="head" style={{ marginBottom: 6 }}>
            <h3 style={{ margin: 0 }}>Cargos vagos cadastrados na Lista de Chamados</h3>
            <span className="row-m num">{vagasList.length} vagas</span>
          </div>
          <p className="sub" style={{ marginTop: 0 }}>
            Estes chamados não possuem ninguém servindo atualmente. Clique em “Indicar pessoa” para iniciar o fluxo formal.
          </p>

          {vagasList.length ? (
            <div className="vagas-grid">
              {vagasList.map(v => (
                <div key={v.cargo.id} className="vaga-card">
                  <div className="vaga-header">
                    <span className="vaga-tag">Vago</span>
                    <div className="vaga-title">{v.cargo.titulo}</div>
                    <div className="vaga-org">{v.orgNome} · {v.orgGrupo}</div>
                    {v.cargo.pendente && (
                      <div className="vaga-pend">
                        ⏳ Em processo: {v.cargo.pendente.pessoa} ({v.cargo.pendente.etapa || 'Indicado'})
                      </div>
                    )}
                  </div>

                  <div className="vaga-actions">
                    {canWrite && (
                      <button
                        type="button"
                        className="btn sm bisp"
                        onClick={() => openModal('chamado', { orgId: v.orgId, orgNome: v.orgNome, cargo: v.cargo })}
                      >
                        + Indicar pessoa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty" style={{ marginBlock: 16 }}>
              Parabéns! Todos os chamados cadastrados da ala estão preenchidos.
            </div>
          )}
        </section>
      )}

      {/* Tab: Desobrigações */}
      {currentView === 'desob' && (
        <section className="card" style={{ paddingBlock: 4 }}>
          {openDesob.length ? (
            <div className="list">
              {openDesob.map(p => {
                const curStep = Number(p.dpasso || 0);
                const nextStepLabel = curStep < D_FLOW.length - 1 ? `✓ ${D_FLOW[curStep]}` : '✓ Concluir no LCR';

                return (
                  <div key={p.id} className="row">
                    <div className="row-main">
                      <div className="row-t">{p.nome}</div>
                      <div className="row-m">
                        <span>{p.chamado || 'Chamado não informado'}</span>
                        {p.responsavel && <span>{p.responsavel}</span>}
                      </div>
                      <ol className="dsteps">
                        {D_FLOW.map((step, idx) => (
                          <li key={step} className={idx < curStep ? 'ok' : idx === curStep ? 'cur' : ''}>
                            {idx < curStep ? '✓ ' : ''}{step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {canWrite && (
                      <div className="acts">
                        <button
                          type="button"
                          className="btn sm"
                          onClick={() => handleAdvanceDesob(p.id)}
                        >
                          {nextStepLabel}
                        </button>
                        <button
                          type="button"
                          className="btn ghost sm danger"
                          onClick={() => handleCancel(p.id, p.nome, true)}
                          title="Cancelar desobrigação"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty" style={{ marginBlock: 12 }}>
              Nenhuma desobrigação pendente no momento.
            </div>
          )}
        </section>
      )}

      {/* Tab: Concluídos */}
      {currentView === 'feitos' && (
        <section className="card" style={{ paddingBlock: 4 }}>
          {concluidos.length ? (
            <div className="list">
              {concluidos.map(p => (
                <div key={p.id} className="row">
                  <div className="row-main">
                    <div className="row-t">{p.nome}</div>
                    <div className="row-m">
                      <span>{p.chamado || 'Chamado não informado'}</span>
                    </div>
                  </div>
                  <div className="acts">
                    <span className={`tag ${isDes(p) ? 'tag-warn' : 'tag-bispado'}`}>
                      {isDes(p) ? 'Desobrigação' : 'Chamado'}
                    </span>
                    {canWrite && (
                      <>
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => handleReopen(p.id)}
                        >
                          Reabrir
                        </button>
                        <button
                          type="button"
                          className="btn ghost sm danger"
                          onClick={() => handleCancel(p.id, p.nome, isDes(p))}
                          title="Excluir do histórico"
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty" style={{ marginBlock: 12 }}>
              Nada concluído ainda.
            </div>
          )}
        </section>
      )}

      {/* Modal: Indicar Chamado ou Nova Desobrigação */}
      {isModalOpen && (
        <div className="modal" onClick={() => setIsModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>{modalTipo === 'chamado' ? 'Indicar chamado' : 'Nova desobrigação'}</h3>
            <p className="sub" style={{ marginTop: -8 }}>
              {modalTipo === 'chamado'
                ? 'Conectado diretamente à Lista de Chamados e ao diretório de Membros.'
                : 'Selecione o chamado ocupado para desobrigar o membro atual.'}
            </p>

            <form onSubmit={handleSubmit} className="form">
              {modalTipo === 'chamado' ? (
                <>
                  {/* Seletor de Chamado (alimentado por Lista de Chamados) */}
                  <div className="field">
                    <label>Chamado a Preencher *</label>
                    <select
                      className="inp"
                      value={selectedCargoRef ? `${selectedCargoRef.org}::${selectedCargoRef.cargo}` : ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (!val) {
                          setSelectedCargoRef(null);
                          setChamado('');
                          return;
                        }
                        const [orgId, cargoId] = val.split('::');
                        const org = suborgs.find(o => o.id === orgId);
                        const cargoObj = org?.cargos?.find(c => c.id === cargoId);
                        if (org && cargoObj) {
                          setSelectedCargoRef({ org: orgId, cargo: cargoId });
                          setChamado(`${cargoObj.titulo} (${org.nome})`);
                        }
                      }}
                      required
                    >
                      <option value="">Selecione um chamado da lista...</option>
                      {suborgs.map(org => (
                        <optgroup key={org.id} label={`${org.nome} · ${org.grupo || 'Organização'}`}>
                          {(org.cargos || []).map(c => {
                            const isVago = !c.pessoa && !c.fixo;
                            const statusSuffix = isVago ? ' [VAGO]' : ` [Ocupado: ${c.pessoa}]`;
                            return (
                              <option key={c.id} value={`${org.id}::${c.id}`}>
                                {c.titulo}{statusSuffix}
                              </option>
                            );
                          })}
                        </optgroup>
                      ))}
                    </select>

                    {chamado && (
                      <div style={{ marginTop: 4, fontSize: '12px', color: 'var(--muted)' }}>
                        Chamado selecionado: <b>{chamado}</b>
                      </div>
                    )}
                  </div>

                  {/* Seletor de Membro (Candidato a Servir) */}
                  <div className="field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Quem vai servir (Candidato) *</span>
                      {members.length > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          {members.length} membros na ala
                        </span>
                      )}
                    </label>

                    <input
                      className="inp"
                      type="search"
                      placeholder="🔍 Digite para filtrar a lista de membros..."
                      value={memberSearchFilter}
                      onChange={e => setMemberSearchFilter(e.target.value)}
                      style={{ marginBottom: 6, fontSize: '12.5px', padding: '6px 10px' }}
                    />

                    <select
                      className="inp"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      required
                    >
                      <option value="">Selecione um membro...</option>
                      {filteredMembers.map(m => {
                        const callings = memberCallingsMap[m.nome.toLowerCase().trim()];
                        const extra = callings && callings.length > 0 ? ` [⚠️ Já serve: ${callings[0]}]` : '';
                        const metaParts = [
                          m.idade ? `${m.idade} anos` : '',
                          m.sexo ? (m.sexo === 'M' ? 'M' : 'F') : '',
                        ].filter(Boolean).join(', ');
                        return (
                          <option key={m.id} value={m.nome}>
                            {m.nome} {metaParts ? `(${metaParts})` : ''}{extra}
                          </option>
                        );
                      })}
                    </select>

                    {nome && memberCallingsMap[nome.toLowerCase().trim()] && (
                      <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: '6px', background: 'rgba(217, 119, 6, 0.1)', border: '1px solid #d97706', fontSize: '12px', color: 'var(--ink)' }}>
                        <strong style={{ color: '#d97706' }}>Aviso:</strong> {nome} já serve como: {memberCallingsMap[nome.toLowerCase().trim()].join(', ')}.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Modal de Desobrigação: Escolher cargo ocupado */
                <>
                  <div className="field">
                    <label>Chamado Atual e Ocupante a Desobrigar *</label>
                    <select
                      className="inp"
                      value={selectedCargoRef ? `${selectedCargoRef.org}::${selectedCargoRef.cargo}` : ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (!val) {
                          setSelectedCargoRef(null);
                          setNome('');
                          setChamado('');
                          return;
                        }
                        const [orgId, cargoId] = val.split('::');
                        const item = occupiedCallingsList.find(x => x.orgId === orgId && x.cargo.id === cargoId);
                        if (item) {
                          setSelectedCargoRef({ org: orgId, cargo: cargoId });
                          setNome(item.cargo.pessoa || '');
                          setChamado(`${item.cargo.titulo} (${item.orgNome})`);
                        }
                      }}
                      required
                    >
                      <option value="">Selecione quem será desobrigado...</option>
                      {occupiedCallingsList.map(item => (
                        <option key={item.cargo.id} value={`${item.orgId}::${item.cargo.id}`}>
                          {item.cargo.pessoa} — {item.cargo.titulo} ({item.orgNome})
                        </option>
                      ))}
                    </select>
                  </div>

                  {nome && (
                    <div className="notice" style={{ fontSize: '12.5px' }}>
                      Pessoa a desobrigar: <b>{nome}</b> do chamado <b>{chamado}</b>
                    </div>
                  )}
                </>
              )}

              <div className="two">
                <div className="field">
                  <label>Responsável</label>
                  <input
                    className="inp"
                    value={responsavel}
                    onChange={e => setResponsavel(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Prazo</label>
                  <input
                    className="inp"
                    type="date"
                    value={prazo}
                    onChange={e => setPrazo(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>Próxima ação</label>
                <input
                  className="inp"
                  value={proxima}
                  onChange={e => setProxima(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Observações confidenciais</label>
                <textarea
                  className="inp"
                  rows={2}
                  value={obs}
                  onChange={e => setObs(e.target.value)}
                  placeholder="Anotações de entrevistas, impressões ou datas..."
                />
              </div>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Salvar {modalTipo === 'chamado' ? 'indicação' : 'desobrigação'}
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsModalOpen(false)}>
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
