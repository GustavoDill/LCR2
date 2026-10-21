import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Designacao, TaskStatus, OriginType, Membro, Ata } from '../types';

export const Designacoes: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const location = useLocation();
  const [items, setItems] = useState<Designacao[]>([]);
  const [members, setMembers] = useState<Membro[]>([]);
  const [atas, setAtas] = useState<Ata[]>([]);
  const [loading, setLoading] = useState(true);
  const [dFilter, setDFilter] = useState<'abertas' | 'atrasadas' | 'concluidas' | 'todas'>('abertas');
  const [dOrig, setDOrig] = useState<'todas' | 'bispado' | 'conselho'>('todas');
  const [editingItem, setEditingItem] = useState<Designacao | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [titulo, setTitulo] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [prazo, setPrazo] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pendente');
  const [proximo, setProximo] = useState('');
  const [origem, setOrigem] = useState<OriginType>('conselho');
  const [ataId, setAtaId] = useState<string | undefined>(undefined);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadItems().then(() => {
      const state = location.state as any;
      if (state?.ataId) {
        openNewModal(state.origin || (isBishopric ? 'bispado' : 'conselho'), state.ataId);
      }
    });
  }, [isBishopric]);

  async function loadItems() {
    try {
      const [desData, membersRes, atasRes] = await Promise.all([
        api.get<Designacao[]>('/designacoes'),
        api.get<{ members: Membro[] }>('/membros').catch(() => ({ members: [] })),
        api.get<Ata[]>('/atas').catch(() => []),
      ]);
      setItems(desData);
      setMembers(membersRes.members || []);
      setAtas(atasRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openNewModal(origin: OriginType = 'conselho', presetAtaId?: string) {
    setEditingItem(null);
    setTitulo('');
    setResponsavel('');
    setPrazo(new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0]);
    setStatus('pendente');
    setProximo('');
    setOrigem(origin);
    setAtaId(presetAtaId || undefined);
    setIsModalOpen(true);
  }

  function openEditModal(d: Designacao) {
    setEditingItem(d);
    setTitulo(d.titulo);
    setResponsavel(d.responsavel || '');
    setPrazo(d.prazo || '');
    setStatus(d.status || 'pendente');
    setProximo(d.proximo || '');
    setOrigem(d.origem || 'conselho');
    setAtaId(d.ataId);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return alert('O título é obrigatório.');

    try {
      if (editingItem) {
        await api.put(`/designacoes/${editingItem.id}`, {
          titulo,
          responsavel,
          prazo,
          status,
          proximo,
          origem,
          ataId,
          currentOrigin: editingItem.origem,
        });
      } else {
        await api.post('/designacoes', {
          titulo,
          responsavel,
          prazo,
          status,
          proximo,
          origem,
          ataId,
        });
      }
      setIsModalOpen(false);
      loadItems();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar designação');
    }
  }

  async function handleCycle(id: string, o: OriginType) {
    if (!canWrite) return;
    try {
      await api.post(`/designacoes/${id}/cycle`, { origem: o });
      loadItems();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status');
    }
  }

  async function handleDelete(id: string, o: OriginType) {
    if (!confirm('Tem certeza de que deseja excluir esta designação?')) return;
    try {
      await api.delete(`/designacoes/${id}?origem=${o}`);
      setIsModalOpen(false);
      loadItems();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir');
    }
  }

  const isLate = (d: Designacao) => d.status !== 'concluida' && d.prazo && d.prazo < today;

  let filtered = items;
  if (isBishopric && dOrig !== 'todas') {
    filtered = filtered.filter(d => d.origem === dOrig);
  }

  const counts = {
    abertas: filtered.filter(d => d.status !== 'concluida').length,
    atrasadas: filtered.filter(isLate).length,
    concluidas: filtered.filter(d => d.status === 'concluida').length,
    todas: filtered.length,
  };

  const fFn = {
    abertas: (d: Designacao) => d.status !== 'concluida',
    atrasadas: isLate,
    concluidas: (d: Designacao) => d.status === 'concluida',
    todas: () => true,
  }[dFilter];

  filtered = filtered.filter(fFn).sort((a, b) => {
    if (dFilter === 'concluidas') return (b.atualizadoEm || 0) - (a.atualizadoEm || 0);
    return (a.prazo || '9999').localeCompare(b.prazo || '9999');
  });

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Designações</h2>
          <p className="sub">
            Quem fará o quê e até quando. Toque na situação para avançar: pendente, em andamento, concluída.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            className="btn pri"
            onClick={() => openNewModal(isBishopric ? 'bispado' : 'conselho')}
          >
            + Nova designação
          </button>
        )}
      </div>

      <div className="btns" style={{ justifyContent: 'space-between' }}>
        <div className="chips">
          {(
            [
              ['abertas', 'Abertas'],
              ['atrasadas', 'Atrasadas'],
              ['concluidas', 'Concluídas'],
              ['todas', 'Todas'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`chip ${dFilter === val ? 'on' : ''}`}
              onClick={() => setDFilter(val)}
            >
              {label} <span className="c num">{counts[val]}</span>
            </button>
          ))}
        </div>

        {isBishopric && (
          <div className="chips">
            {(
              [
                ['todas', 'Todas'],
                ['bispado', 'Bispado'],
                ['conselho', 'Conselho'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`chip ${dOrig === val ? 'on' : ''}`}
                onClick={() => setDOrig(val)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <section className="card" style={{ paddingBlock: 4 }}>
        {loading ? (
          <div className="empty">Carregando designações…</div>
        ) : filtered.length ? (
          <div className="list">
            {filtered.map(d => {
              const late = isLate(d);
              return (
                <div key={`${d.origem}-${d.id}`} className="row">
                  <button
                    type="button"
                    className={`st st-${d.status || 'pendente'}`}
                    onClick={() => handleCycle(d.id, d.origem)}
                    disabled={!canWrite}
                    title="Tocar para mudar a situação"
                  >
                    {d.status === 'andamento' ? 'Em andamento' : d.status === 'concluida' ? 'Concluída' : 'Pendente'}
                  </button>

                  <div className="row-main">
                    <div className="row-t">{d.titulo}</div>
                    <div className="row-m">
                      <span>{d.responsavel || 'Sem responsável'}</span>
                      <span className={late ? 'late-txt' : ''}>
                        {d.prazo ? `Prazo: ${d.prazo}` : 'Sem prazo'}
                        {late ? ' · atrasada' : ''}
                      </span>
                    </div>
                    {d.proximo && <div className="row-n">Próximo passo: {d.proximo}</div>}
                  </div>

                  <div className="acts">
                    {d.ataId && (
                      <span
                        className="tag"
                        style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
                        title={`Vinculada à Ata (${atas.find(a => a.id === d.ataId)?.data || d.ataId})`}
                      >
                        📝 Ata{atas.find(a => a.id === d.ataId)?.data ? ` · ${atas.find(a => a.id === d.ataId)!.data.slice(5)}` : ''}
                      </span>
                    )}
                    {isBishopric && (
                      <span className={`tag tag-${d.origem}`}>
                        {d.origem === 'bispado' ? 'Só bispado' : 'Conselho'}
                      </span>
                    )}
                    {canWrite && (
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => openEditModal(d)}
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
            {dFilter === 'atrasadas'
              ? 'Nenhuma designação atrasada.'
              : 'Nenhuma designação encontrada com os filtros selecionados.'}
          </div>
        )}
      </section>

      {/* Modal de Nova/Editar Designação */}
      {isModalOpen && (
        <div className="modal" onClick={() => setIsModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>{editingItem ? 'Editar designação' : 'Nova designação'}</h3>
            <form onSubmit={handleSubmit} className="form">
              {ataId && (
                <div style={{ fontSize: '12px', color: '#38bdf8', padding: '6px 10px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '6px' }}>
                  📝 Vinculada à Ata de Reunião: <b>{atas.find(a => a.id === ataId)?.data || ataId}</b>
                </div>
              )}

              <div className="field">
                <label>Designação *</label>
                <input
                  className="inp"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex.: Visitar a família Souza com o presidente do quórum"
                  required
                />
              </div>

              <div className="field">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Responsável</span>
                  {members.length > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {members.length} membros na ala
                    </span>
                  )}
                </label>

                {/* Atalhos rápidos de liderança */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '6px' }}>
                  {['Bispo', '1º Conselheiro', '2º Conselheiro', 'Secretário', 'Pres. Élderes', 'Pres. Soc. Socorro'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className="chip sm"
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                      onClick={() => setResponsavel(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <input
                  className="inp"
                  list="membros-designacao-list"
                  value={responsavel}
                  onChange={e => setResponsavel(e.target.value)}
                  placeholder="Digite um nome ou cargo, ou selecione da lista..."
                />
                <datalist id="membros-designacao-list">
                  {members.map(m => (
                    <option key={m.id} value={m.nome}>
                      {m.chamado ? `${m.nome} (${m.chamado})` : m.nome}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="two">
                <div className="field">
                  <label>Prazo</label>
                  <input
                    className="inp"
                    type="date"
                    value={prazo}
                    onChange={e => setPrazo(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Situação</label>
                  <select
                    className="inp"
                    value={status}
                    onChange={e => setStatus(e.target.value as TaskStatus)}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="andamento">Em andamento</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Próximo passo</label>
                <textarea
                  className="inp"
                  value={proximo}
                  onChange={e => setProximo(e.target.value)}
                  placeholder="O que precisa ser feito primeiro"
                />
              </div>

              {isBishopric && (
                <div className="field">
                  <label>Quem vê esta designação</label>
                  <select
                    className="inp"
                    value={origem}
                    onChange={e => setOrigem(e.target.value as OriginType)}
                  >
                    <option value="bispado">Só o bispado (confidencial)</option>
                    <option value="conselho">Conselho da Ala (todos os líderes veem)</option>
                  </select>
                </div>
              )}

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Salvar
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                </div>
                {editingItem && (
                  <button
                    type="button"
                    className="btn ghost danger"
                    onClick={() => handleDelete(editingItem.id, editingItem.origem)}
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
