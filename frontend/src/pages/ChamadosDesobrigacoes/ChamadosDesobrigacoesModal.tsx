import React, { useState, useEffect, useMemo } from 'react';
import { Organizacao, Membro } from '../../types';
import { ModalTipo, OccupiedCargoItem, ChamadoFormData } from './chamadosDesobrigacoesConstants';

interface InitialModalData {
  nome?: string;
  chamado?: string;
  selectedCargoRef?: { org: string; cargo: string } | null;
  proxima?: string;
  responsavel?: string;
  prazo?: string;
  obs?: string;
}

interface ChamadosDesobrigacoesModalProps {
  isOpen: boolean;
  modalTipo: ModalTipo;
  onClose: () => void;
  onSubmit: (data: ChamadoFormData) => Promise<void>;
  suborgs: Organizacao[];
  members: Membro[];
  memberCallingsMap: Record<string, string[]>;
  occupiedCallingsList: OccupiedCargoItem[];
  initialData?: InitialModalData;
}

export const ChamadosDesobrigacoesModal: React.FC<ChamadosDesobrigacoesModalProps> = ({
  isOpen,
  modalTipo,
  onClose,
  onSubmit,
  suborgs,
  members,
  memberCallingsMap,
  occupiedCallingsList,
  initialData,
}) => {
  const [nome, setNome] = useState('');
  const [chamado, setChamado] = useState('');
  const [selectedCargoRef, setSelectedCargoRef] = useState<{ org: string; cargo: string } | null>(null);
  const [proxima, setProxima] = useState('');
  const [responsavel, setResponsavel] = useState('Bispo');
  const [prazo, setPrazo] = useState('');
  const [obs, setObs] = useState('');
  const [memberSearchFilter, setMemberSearchFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNome(initialData?.nome || '');
      setChamado(initialData?.chamado || '');
      setSelectedCargoRef(initialData?.selectedCargoRef || null);
      setProxima(
        initialData?.proxima || (modalTipo === 'chamado' ? 'Entrevista com o bispado' : 'Conversar com a pessoa')
      );
      setResponsavel(initialData?.responsavel || 'Bispo');
      setPrazo(initialData?.prazo || '');
      setObs(initialData?.obs || '');
      setMemberSearchFilter('');
    }
  }, [isOpen, initialData, modalTipo]);

  const filteredMembers = useMemo(() => {
    const q = memberSearchFilter.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      m => m.nome.toLowerCase().includes(q) || (m.nomeOriginal && m.nomeOriginal.toLowerCase().includes(q))
    );
  }, [memberSearchFilter, members]);

  if (!isOpen) return null;

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return alert('O nome é obrigatório.');

    await onSubmit({
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
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <h3>{modalTipo === 'chamado' ? 'Indicar chamado' : 'Nova desobrigação'}</h3>
        <p className="sub" style={{ marginTop: -8 }}>
          {modalTipo === 'chamado'
            ? 'Conectado diretamente à Lista de Chamados e ao diretório de Membros.'
            : 'Selecione o chamado ocupado para desobrigar o membro atual.'}
        </p>

        <form onSubmit={handleFormSubmit} className="form">
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
              <button type="button" className="btn ghost" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
