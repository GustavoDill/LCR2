import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Pessoa, PessoaTipo } from '../types';

export const PT_MAP: Record<PessoaTipo, { l: string; det: string; opts: string[] }> = {
  acomp: {
    l: 'Acompanhamento',
    det: 'Situação',
    opts: ['Família que precisa de apoio', 'Membro afastado', 'Membro novo ou converso', 'Retornando à atividade', 'Jovem', 'Criança', 'Outro'],
  },
  ordenanca: {
    l: 'Ordenanças',
    det: 'Ordenança',
    opts: ['Batismo', 'Confirmação', 'Sacerdócio Aarônico', 'Sacerdócio de Melquisedeque', 'Investidura', 'Selamento', 'Recomendação para o templo', 'Batismos vicários'],
  },
  chamado: {
    l: 'Chamados',
    det: 'Etapa',
    opts: ['Indicado', 'Aprovação do bispado', 'Entrevista', 'Apoio na sacramental', 'Designação', 'Desobrigação'],
  },
  missao: {
    l: 'Missionário',
    det: 'Situação',
    opts: ['Sendo ensinado', 'Batismo previsto', 'Futuro missionário', 'Preparando papéis', 'Chamado recebido', 'Em serviço', 'Retornado'],
  },
  temporal: {
    l: 'Necessidades temporais',
    det: 'Necessidade',
    opts: ['Alimentação', 'Moradia', 'Emprego', 'Transporte', 'Emergência', 'Autossuficiência', 'Outra'],
  },
};

export const Pessoas: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTipo, setActiveTipo] = useState<PessoaTipo>('acomp');
  const [showDone, setShowDone] = useState(false);
  const [editingPessoa, setEditingPessoa] = useState<Pessoa | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<PessoaTipo>('acomp');
  const [detalhe, setDetalhe] = useState('');
  const [proxima, setProxima] = useState('');
  const [responsavel, setResponsavel] = useState('Bispo');
  const [prazo, setPrazo] = useState('');
  const [obs, setObs] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadPessoas();
  }, [isBishopric]);

  async function loadPessoas() {
    try {
      const data = await api.get<Pessoa[]>('/pessoas');
      setPessoas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openNewModal(t: PessoaTipo) {
    setEditingPessoa(null);
    setNome('');
    setTipo(t);
    setDetalhe(PT_MAP[t].opts[0]);
    setProxima('');
    setResponsavel('Bispo');
    setPrazo('');
    setObs('');
    setIsModalOpen(true);
  }

  function openEditModal(p: Pessoa) {
    setEditingPessoa(p);
    setNome(p.nome);
    setTipo(p.tipo);
    setDetalhe(p.detalhe || PT_MAP[p.tipo].opts[0]);
    setProxima(p.proxima || '');
    setResponsavel(p.responsavel || '');
    setPrazo(p.prazo || '');
    setObs(p.obs || '');
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return alert('O nome é obrigatório.');

    try {
      if (editingPessoa) {
        await api.put(`/pessoas/${editingPessoa.id}`, {
          nome,
          tipo,
          detalhe,
          proxima,
          responsavel,
          prazo,
          obs,
        });
      } else {
        await api.post('/pessoas', {
          nome,
          tipo,
          detalhe,
          proxima,
          responsavel,
          prazo,
          obs,
        });
      }
      setIsModalOpen(false);
      loadPessoas();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar pessoa');
    }
  }

  async function handleToggle(id: string) {
    if (!canWrite) return;
    try {
      await api.post(`/pessoas/${id}/toggle`);
      loadPessoas();
    } catch (err: any) {
      alert(err.message || 'Erro ao alternar status');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este registro de acompanhamento?')) return;
    try {
      await api.delete(`/pessoas/${id}`);
      setIsModalOpen(false);
      loadPessoas();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir');
    }
  }

  if (!isBishopric) {
    return <div className="notice bisp">Acesso restrito aos membros do Bispado.</div>;
  }

  if (loading) {
    return <div className="empty">Carregando acompanhamento de pessoas…</div>;
  }

  const categoryOptions: PessoaTipo[] = ['acomp', 'ordenanca', 'missao', 'temporal'];
  const filtered = pessoas
    .filter(p => p.tipo === activeTipo && (showDone ? true : p.status !== 'concluido'))
    .sort((a, b) => (a.status === 'concluido' ? 1 : 0) - (b.status === 'concluido' ? 1 : 0) || (a.prazo || '9999').localeCompare(b.prazo || '9999'));

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Pessoas</h2>
          <p className="sub">
            Acompanhamento de pessoas e famílias, ordenanças, trabalho missionário e necessidades temporais.
          </p>
        </div>
        {canWrite && (
          <button type="button" className="btn bisp" onClick={() => openNewModal(activeTipo)}>
            + Adicionar
          </button>
        )}
      </div>

      <div className="notice bisp">
        <b>Somente o bispado vê esta página.</b> Registre apenas o necessário para lembrar a próxima ação. Assuntos de dignidade e conversas confidenciais não devem ser escritos aqui.
      </div>

      <div className="btns" style={{ justifyContent: 'space-between' }}>
        <div className="chips">
          {categoryOptions.map(cat => {
            const count = pessoas.filter(p => p.tipo === cat && p.status !== 'concluido').length;
            return (
              <button
                key={cat}
                type="button"
                className={`chip ${activeTipo === cat ? 'on' : ''}`}
                onClick={() => setActiveTipo(cat)}
              >
                {PT_MAP[cat].l} <span className="c num">{count}</span>
              </button>
            );
          })}
        </div>

        <label className="chk" style={{ fontSize: 13 }}>
          <input
            type="checkbox"
            checked={showDone}
            onChange={e => setShowDone(e.target.checked)}
          />
          Mostrar concluídos
        </label>
      </div>

      {filtered.length ? (
        <div className="pgrid">
          {filtered.map(p => {
            const isLate = p.status !== 'concluido' && p.prazo && p.prazo < today;

            return (
              <article key={p.id} className={`pcard ${p.status === 'concluido' ? 'done' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                  <div className="nm">{p.nome}</div>
                  {isLate && <span className="tag tag-late">vencida</span>}
                </div>

                <div className="chips">
                  <span className="tag tag-bispado">{p.detalhe || PT_MAP[p.tipo].l}</span>
                </div>

                {p.proxima && (
                  <div className="nx">
                    <span className="lbl">Próxima ação</span>
                    <br />
                    {p.proxima}
                    {p.prazo && <span className={isLate ? 'late-txt' : ''}> · {p.prazo}</span>}
                  </div>
                )}

                {p.obs && <div className="ob">{p.obs}</div>}

                <div className="ft">
                  <span className="row-m" style={{ margin: 0 }}>
                    {p.responsavel || 'Sem responsável'}
                  </span>
                  <div className="btns">
                    {canWrite && (
                      <>
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => handleToggle(p.id)}
                        >
                          {p.status === 'concluido' ? 'Reabrir' : 'Concluir'}
                        </button>
                        <button
                          type="button"
                          className="btn sm"
                          onClick={() => openEditModal(p)}
                        >
                          Editar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty">Ninguém registrado em {PT_MAP[activeTipo].l.toLowerCase()} ainda.</div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal" onClick={() => setIsModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>{editingPessoa ? 'Editar acompanhamento' : 'Adicionar pessoa'}</h3>
            <form onSubmit={handleSubmit} className="form">
              <div className="field">
                <label>Nome ou família *</label>
                <input
                  className="inp"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Nome completo ou Família X"
                  required
                />
              </div>

              <div className="field">
                <label>Categoria</label>
                <select
                  className="inp"
                  value={tipo}
                  onChange={e => {
                    const nextT = e.target.value as PessoaTipo;
                    setTipo(nextT);
                    setDetalhe(PT_MAP[nextT].opts[0]);
                  }}
                >
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>
                      {PT_MAP[cat].l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>{PT_MAP[tipo].det}</label>
                <select
                  className="inp"
                  value={detalhe}
                  onChange={e => setDetalhe(e.target.value)}
                >
                  {PT_MAP[tipo].opts.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Próxima ação</label>
                <input
                  className="inp"
                  value={proxima}
                  onChange={e => setProxima(e.target.value)}
                  placeholder="Ex.: Entrevista com o bispo"
                />
              </div>

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
                <label>Observações</label>
                <textarea
                  className="inp"
                  value={obs}
                  onChange={e => setObs(e.target.value)}
                />
              </div>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Salvar
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                </div>
                {editingPessoa && (
                  <button
                    type="button"
                    className="btn ghost danger"
                    onClick={() => handleDelete(editingPessoa.id)}
                  >
                    Excluir
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
