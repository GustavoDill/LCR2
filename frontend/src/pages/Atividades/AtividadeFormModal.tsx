import React, { useEffect, useState } from 'react';
import { Atividade, AprovacaoAtividade } from '../../types';
import { ORGANIZACOES_LIST } from './atividadesConstants';

export interface AtividadeFormData {
  org: string;
  titulo: string;
  proposito: string;
  publico: string;
  participantes: string;
  objetivo: string;
  data: string;
  inicio: string;
  fim: string;
  local: 'capela' | 'outro';
  localOutro: string;
  capela: 'sim' | 'nao' | 'na';
  responsavel: string;
  telefone: string;
  liderExtra: 'sim' | 'nao';
  liderQuem?: string;
  custo: 'sim' | 'nao';
  valor: number;
  orcamento: string;
  itens: string;
  menores: boolean;
  permissao: boolean;
  doisAdultos: boolean;
  alimentacao: boolean;
  transporte: boolean;
  foraCidade: boolean;
  obs: string;
}

interface AtividadeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAtv: Atividade | null;
  aprovacoes: Record<string, AprovacaoAtividade>;
  user: any;
  onSubmit: (formData: AtividadeFormData) => void;
}

export const AtividadeFormModal: React.FC<AtividadeFormModalProps> = ({
  isOpen,
  onClose,
  editingAtv,
  aprovacoes,
  user,
  onSubmit,
}) => {
  const [formOrg, setFormOrg] = useState('Quórum de Élderes');
  const [formTitulo, setFormTitulo] = useState('');
  const [formProposito, setFormProposito] = useState('Integração');
  const [formPublico, setFormPublico] = useState('Toda a ala');
  const [formParticipantes, setFormParticipantes] = useState('');
  const [formObjetivo, setFormObjetivo] = useState('');
  const [formData, setFormData] = useState('');
  const [formInicio, setFormInicio] = useState('18:00');
  const [formFim, setFormFim] = useState('21:00');
  const [formLocal, setFormLocal] = useState<'capela' | 'outro'>('capela');
  const [formLocalOutro, setFormLocalOutro] = useState('');
  const [formCapela, setFormCapela] = useState<'sim' | 'nao' | 'na'>('nao');
  const [formResp, setFormResp] = useState('');
  const [formTel, setFormTel] = useState('');
  const [formLiderExtra, setFormLiderExtra] = useState<'sim' | 'nao'>('nao');
  const [formLiderQuem, setFormLiderQuem] = useState('Bispado');
  const [formCusto, setFormCusto] = useState<'sim' | 'nao'>('nao');
  const [formValor, setFormValor] = useState('');
  const [formOrcamento, setFormOrcamento] = useState('');
  const [formItens, setFormItens] = useState('');
  const [formMenores, setFormMenores] = useState(false);
  const [formPermissao, setFormPermissao] = useState(false);
  const [formDoisAdultos, setFormDoisAdultos] = useState(true);
  const [formAlimentacao, setFormAlimentacao] = useState(false);
  const [formTransporte, setFormTransporte] = useState(false);
  const [formForaCidade, setFormForaCidade] = useState(false);
  const [formObs, setFormObs] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (editingAtv) {
      setFormOrg(editingAtv.org || 'Quórum de Élderes');
      setFormTitulo(editingAtv.titulo || '');
      setFormProposito(editingAtv.proposito || 'Integração');
      setFormPublico(editingAtv.publico || 'Toda a ala');
      setFormParticipantes(editingAtv.participantes || '');
      setFormObjetivo(editingAtv.objetivo || '');
      setFormData(editingAtv.data || '');
      setFormInicio(editingAtv.inicio || '18:00');
      setFormFim(editingAtv.fim || '21:00');
      setFormLocal(editingAtv.local || 'capela');
      setFormLocalOutro(editingAtv.localOutro || '');
      setFormCapela(editingAtv.capela || 'nao');
      setFormResp(editingAtv.responsavel || user?.displayName || '');
      setFormTel(editingAtv.telefone || '');
      setFormLiderExtra(editingAtv.liderExtra || 'nao');
      setFormLiderQuem(editingAtv.liderQuem || 'Bispado');
      setFormCusto(editingAtv.custo || 'nao');
      setFormValor(editingAtv.valor ? String(editingAtv.valor) : '');
      setFormOrcamento(editingAtv.orcamento || editingAtv.org || '');
      setFormItens(editingAtv.itens || '');
      setFormMenores(Boolean(editingAtv.menores));
      setFormPermissao(Boolean(editingAtv.permissao));
      setFormDoisAdultos(editingAtv.doisAdultos !== false);
      setFormAlimentacao(Boolean(editingAtv.alimentacao));
      setFormTransporte(Boolean(editingAtv.transporte));
      setFormForaCidade(Boolean(editingAtv.foraCidade));
      setFormObs(editingAtv.obs || '');
    } else {
      setFormOrg(user?.organizacao || 'Moças');
      setFormTitulo('');
      setFormProposito('Integração');
      setFormPublico('Moças');
      setFormParticipantes('');
      setFormObjetivo('');
      setFormData('');
      setFormInicio('18:00');
      setFormFim('21:00');
      setFormLocal('capela');
      setFormLocalOutro('');
      setFormCapela('nao');
      setFormResp(user?.displayName || '');
      setFormTel('');
      setFormLiderExtra('nao');
      setFormLiderQuem('Bispado');
      setFormCusto('nao');
      setFormValor('');
      setFormOrcamento(user?.organizacao || 'Moças');
      setFormItens('');
      setFormMenores(false);
      setFormPermissao(false);
      setFormDoisAdultos(true);
      setFormAlimentacao(false);
      setFormTransporte(false);
      setFormForaCidade(false);
      setFormObs('');
    }
  }, [isOpen, editingAtv, user]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formData) {
      alert('Preencha os campos obrigatórios (Título e Data).');
      return;
    }

    const payload: AtividadeFormData = {
      org: formOrg,
      titulo: formTitulo.trim(),
      proposito: formProposito,
      publico: formPublico,
      participantes: formParticipantes.trim(),
      objetivo: formObjetivo.trim(),
      data: formData,
      inicio: formInicio,
      fim: formFim,
      local: formLocal,
      localOutro: formLocalOutro.trim(),
      capela: formCapela,
      responsavel: formResp.trim() || user?.displayName || 'Responsável',
      telefone: formTel.trim(),
      liderExtra: formLiderExtra,
      liderQuem: formLiderExtra === 'sim' ? formLiderQuem.trim() : undefined,
      custo: formCusto,
      valor: formCusto === 'sim' ? parseFloat(formValor.replace(',', '.')) || 0 : 0,
      orcamento: formOrcamento.trim() || formOrg,
      itens: formItens.trim(),
      menores: formMenores,
      permissao: formPermissao,
      doisAdultos: formDoisAdultos,
      alimentacao: formAlimentacao,
      transporte: formTransporte,
      foraCidade: formForaCidade,
      obs: formObs.trim(),
    };

    onSubmit(payload);
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet wide" onClick={e => e.stopPropagation()}>
        <h3>{editingAtv ? 'Editar Solicitação de Atividade' : 'Nova Solicitação de Atividade'}</h3>

        <div style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: '8px', marginBottom: 14, fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '18px' }}>👤</span>
          <div>
            <div><strong>Solicitante:</strong> {user?.displayName || 'Usuário atual'} ({user?.email || 'Sem e-mail cadastrado'})</div>
            <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{user?.cargo || 'Membro'} · {user?.organizacao || formOrg}</div>
          </div>
        </div>

        {editingAtv && aprovacoes[editingAtv.id]?.comentario && (
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', padding: '10px 12px', borderRadius: '8px', marginBottom: 14, fontSize: '13px' }}>
            <strong style={{ color: '#3b82f6', display: 'block', marginBottom: 4 }}>Instruções do Bispado para alterações:</strong>
            <span style={{ color: 'var(--ink)', whiteSpace: 'pre-line' }}>{aprovacoes[editingAtv.id].comentario}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <fieldset className="fsec">
            <legend>1. Atividade</legend>
            <div className="two">
              <div className="field">
                <label>Organização *</label>
                <select
                  className="inp"
                  value={formOrg}
                  onChange={e => {
                    setFormOrg(e.target.value);
                    if (!formOrcamento) setFormOrcamento(e.target.value);
                  }}
                  required
                >
                  {ORGANIZACOES_LIST.map(org => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Nome da atividade *</label>
                <input
                  className="inp"
                  value={formTitulo}
                  onChange={e => setFormTitulo(e.target.value)}
                  placeholder="Ex.: Dia de Pizza"
                  required
                />
              </div>
            </div>

            <div className="two">
              <div className="field">
                <label>Propósito</label>
                <input
                  className="inp"
                  value={formProposito}
                  onChange={e => setFormProposito(e.target.value)}
                  placeholder="Ex.: Integração, Espiritual, Serviço"
                />
              </div>
              <div className="field">
                <label>Público</label>
                <input
                  className="inp"
                  value={formPublico}
                  onChange={e => setFormPublico(e.target.value)}
                  placeholder="Ex.: Moças, Toda a ala"
                />
              </div>
            </div>

            <div className="two">
              <div className="field">
                <label>Participantes estimados</label>
                <input
                  className="inp"
                  value={formParticipantes}
                  onChange={e => setFormParticipantes(e.target.value)}
                  placeholder="Ex.: 12"
                />
              </div>
              <div className="field">
                <label>Líder responsável pela execução *</label>
                <input
                  className="inp"
                  value={formResp}
                  onChange={e => setFormResp(e.target.value)}
                  placeholder="Nome do líder"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>Objetivo</label>
              <textarea
                className="inp"
                value={formObjetivo}
                onChange={e => setFormObjetivo(e.target.value)}
                placeholder="Ex.: fazer pizza e aprender a orar"
                rows={2}
              />
            </div>
          </fieldset>

          <fieldset className="fsec">
            <legend>2. Data, Horário e Local</legend>
            <div className="two">
              <div className="field">
                <label>Data *</label>
                <input
                  className="inp"
                  type="date"
                  value={formData}
                  onChange={e => setFormData(e.target.value)}
                  required
                />
              </div>
              <div className="two">
                <div className="field">
                  <label>Início</label>
                  <input
                    className="inp"
                    type="time"
                    value={formInicio}
                    onChange={e => setFormInicio(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Fim</label>
                  <input
                    className="inp"
                    type="time"
                    value={formFim}
                    onChange={e => setFormFim(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="two">
              <div className="field">
                <label>Local</label>
                <select
                  className="inp"
                  value={formLocal}
                  onChange={e => setFormLocal(e.target.value as any)}
                >
                  <option value="capela">Capela da Ala Bosque</option>
                  <option value="outro">Outro local</option>
                </select>
              </div>
              <div className="field">
                <label>Capela reservada?</label>
                <select
                  className="inp"
                  value={formCapela}
                  onChange={e => setFormCapela(e.target.value as any)}
                >
                  <option value="nao">Ainda não, precisa reservar</option>
                  <option value="sim">Sim, já reservada</option>
                  <option value="na">Não se aplica</option>
                </select>
              </div>
            </div>

            {formLocal === 'outro' && (
              <div className="field">
                <label>Endereço / Detalhe do local</label>
                <input
                  className="inp"
                  value={formLocalOutro}
                  onChange={e => setFormLocalOutro(e.target.value)}
                  placeholder="Ex.: Casa da família Silva, Parque Barigui"
                />
              </div>
            )}

            <div className="two">
              <div className="field">
                <label>Telefone para contato</label>
                <input
                  className="inp"
                  value={formTel}
                  onChange={e => setFormTel(e.target.value)}
                  placeholder="Ex.: 54999887755"
                />
              </div>
              <div className="two">
                <div className="field">
                  <label>Precisa de líder de apoio?</label>
                  <select
                    className="inp"
                    value={formLiderExtra}
                    onChange={e => setFormLiderExtra(e.target.value as any)}
                  >
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>
                {formLiderExtra === 'sim' && (
                  <div className="field">
                    <label>Qual líder?</label>
                    <input
                      className="inp"
                      value={formLiderQuem}
                      onChange={e => setFormLiderQuem(e.target.value)}
                      placeholder="Ex.: Bispado"
                    />
                  </div>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="fsec">
            <legend>3. Custos e Itens</legend>
            <div className="two">
              <div className="field">
                <label>Terá custo do orçamento da ala?</label>
                <select
                  className="inp"
                  value={formCusto}
                  onChange={e => setFormCusto(e.target.value as any)}
                >
                  <option value="nao">Não, sem custo</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
              {formCusto === 'sim' && (
                <div className="field">
                  <label>Valor estimado (R$)</label>
                  <input
                    className="inp"
                    value={formValor}
                    onChange={e => setFormValor(e.target.value)}
                    placeholder="200,00"
                  />
                </div>
              )}
            </div>

            {formCusto === 'sim' && (
              <div className="two">
                <div className="field">
                  <label>Orçamento de qual organização?</label>
                  <input
                    className="inp"
                    value={formOrcamento}
                    onChange={e => setFormOrcamento(e.target.value)}
                    placeholder="Ex.: Moças"
                  />
                </div>
                <div className="field">
                  <label>Itens a adquirir</label>
                  <input
                    className="inp"
                    value={formItens}
                    onChange={e => setFormItens(e.target.value)}
                    placeholder="Ex.: pizza, descartáveis"
                  />
                </div>
              </div>
            )}
          </fieldset>

          <fieldset className="fsec">
            <legend>4. Segurança e Logística</legend>
            <label className="chk">
              <input
                type="checkbox"
                checked={formMenores}
                onChange={e => setFormMenores(e.target.checked)}
              />
              A atividade envolve crianças ou jovens (Moças/Rapazes/Primária)
            </label>

            <label className="chk">
              <input
                type="checkbox"
                checked={formDoisAdultos}
                onChange={e => setFormDoisAdultos(e.target.checked)}
              />
              Pelo menos dois adultos responsáveis estarão presentes (Norma da Igreja)
            </label>

            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: 6 }}>Logística necessária:</label>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <label className="chk">
                  <input
                    type="checkbox"
                    checked={formAlimentacao}
                    onChange={e => setFormAlimentacao(e.target.checked)}
                  />
                  Alimentação
                </label>
                <label className="chk">
                  <input
                    type="checkbox"
                    checked={formTransporte}
                    onChange={e => setFormTransporte(e.target.checked)}
                  />
                  Transporte
                </label>
                <label className="chk">
                  <input
                    type="checkbox"
                    checked={formForaCidade}
                    onChange={e => setFormForaCidade(e.target.checked)}
                  />
                  Fora da cidade
                </label>
              </div>
            </div>

            <div className="field" style={{ marginTop: 10 }}>
              <label>Observações adicionais</label>
              <textarea
                className="inp"
                value={formObs}
                onChange={e => setFormObs(e.target.value)}
                placeholder="Ex.: Informações extras sobre horários ou preparativos"
                rows={2}
              />
            </div>
          </fieldset>

          <div className="foot">
            <div className="btns">
              <button type="submit" className="btn pri">
                {editingAtv ? 'Salvar e Reenviar ao Bispado' : 'Enviar para aprovação do Bispado'}
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
