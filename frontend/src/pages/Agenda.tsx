import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AgendaEvento } from '../types';

export const ORGS_LIST = [
  'Ala', 'Bispado', 'Quórum de Élderes', 'Sociedade de Socorro', 'Moças', 'Rapazes',
  'Primária', 'Escola Dominical', 'Jovens adultos', 'Estaca', 'Templo'
];

export const PROPS_LIST = [
  'Fortalecimento espiritual', 'Integração', 'Missionário', 'Família', 'Jovens',
  'Crianças', 'Templo', 'Serviço', 'Autossuficiência'
];

export const Agenda: React.FC = () => {
  const { canWrite } = useAuth();
  const [events, setEvents] = useState<AgendaEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvento | null>(null);
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState('');
  const [org, setOrg] = useState('Ala');
  const [proposito, setProposito] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [obs, setObs] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const data = await api.get<AgendaEvento[]>('/agenda');
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openNewModal() {
    setEditingEvent(null);
    setTitulo('');
    setData(today);
    setOrg('Ala');
    setProposito('');
    setResponsavel('');
    setObs('');
    setIsModalOpen(true);
  }

  function openEditModal(e: AgendaEvento) {
    setEditingEvent(e);
    setTitulo(e.titulo);
    setData(e.data);
    setOrg(e.org);
    setProposito(e.proposito || '');
    setResponsavel(e.responsavel || '');
    setObs(e.obs || '');
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !data) return alert('Título e data são obrigatórios.');

    try {
      if (editingEvent) {
        await api.put(`/agenda/${editingEvent.id}`, {
          titulo,
          data,
          org,
          proposito,
          responsavel,
          obs,
        });
      } else {
        await api.post('/agenda', {
          titulo,
          data,
          org,
          proposito,
          responsavel,
          obs,
        });
      }
      setIsModalOpen(false);
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar evento');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este evento?')) return;
    try {
      await api.delete(`/agenda/${id}`);
      setIsModalOpen(false);
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir');
    }
  }

  if (loading) {
    return <div className="empty">Carregando agenda da ala…</div>;
  }

  const filtered = events
    .filter(e => (showPast ? e.data < today : e.data >= today))
    .sort((a, b) => (showPast ? b.data.localeCompare(a.data) : a.data.localeCompare(b.data)));

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Agenda da ala</h2>
          <p className="sub">
            Cada atividade com um propósito definido: não fazer atividades só porque estão no calendário.
          </p>
        </div>
        {canWrite && (
          <button type="button" className="btn pri" onClick={openNewModal}>
            + Novo evento
          </button>
        )}
      </div>

      <div className="chips">
        <button
          type="button"
          className={`chip ${!showPast ? 'on' : ''}`}
          onClick={() => setShowPast(false)}
        >
          Próximos
        </button>
        <button
          type="button"
          className={`chip ${showPast ? 'on' : ''}`}
          onClick={() => setShowPast(true)}
        >
          Anteriores
        </button>
      </div>

      <section className="card" style={{ paddingBlock: 4 }}>
        {filtered.length ? (
          <div className="list">
            {filtered.map(e => (
              <div key={e.id} className="row">
                <div className="dateb">
                  <div className="d">{e.data.split('-')[2]}</div>
                  <div className="w">{e.data.split('-')[1]}</div>
                </div>

                <div className="row-main">
                  <div className="row-t">{e.titulo}</div>
                  <div className="row-m">
                    <span>{e.org}</span>
                    {e.responsavel && <span>{e.responsavel}</span>}
                  </div>
                  {e.proposito && (
                    <div style={{ marginTop: 4 }}>
                      <span className="tag tag-soft">{e.proposito}</span>
                    </div>
                  )}
                  {e.obs && <div className="row-n">{e.obs}</div>}
                </div>

                {canWrite && (
                  <div className="acts">
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => openEditModal(e)}
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ marginBlock: 12 }}>
            {showPast ? 'Nenhum evento anterior.' : 'Nenhum evento agendado.'}
          </div>
        )}
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal" onClick={() => setIsModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>{editingEvent ? 'Editar evento' : 'Novo evento'}</h3>
            <form onSubmit={handleSubmit} className="form">
              <div className="field">
                <label>Evento *</label>
                <input
                  className="inp"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex.: Batismo da família Lima"
                  required
                />
              </div>

              <div className="two">
                <div className="field">
                  <label>Data *</label>
                  <input
                    className="inp"
                    type="date"
                    value={data}
                    onChange={e => setData(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>Organização</label>
                  <select
                    className="inp"
                    value={org}
                    onChange={e => setOrg(e.target.value)}
                  >
                    {ORGS_LIST.map(o => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="two">
                <div className="field">
                  <label>Propósito</label>
                  <select
                    className="inp"
                    value={proposito}
                    onChange={e => setProposito(e.target.value)}
                  >
                    <option value="">Escolha o propósito</option>
                    {PROPS_LIST.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Responsável</label>
                  <input
                    className="inp"
                    value={responsavel}
                    onChange={e => setResponsavel(e.target.value)}
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
                {editingEvent && (
                  <button
                    type="button"
                    className="btn ghost danger"
                    onClick={() => handleDelete(editingEvent.id)}
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
