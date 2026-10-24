import React, { useState } from 'react';
import { SIRAluno, Membro } from '../../types';
import { api } from '../../api/client';
import { IconCheck } from '../../components/Icons';

interface SeminarioPastoralModalProps {
  aluno: SIRAluno | null;
  onClose: () => void;
  members: Membro[];
  onOpenMember360?: (member: Membro) => void;
}

export const SeminarioPastoralModal: React.FC<SeminarioPastoralModalProps> = ({
  aluno,
  onClose,
  members,
  onOpenMember360,
}) => {
  if (!aluno) return null;

  const [responsavel, setResponsavel] = useState('Bispo');
  const [titulo, setTitulo] = useState(`Acompanhamento pastoral de ${aluno.nome} (${aluno.tipo})`);
  const [prazo, setPrazo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [notas, setNotas] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [salvoSucesso, setSalvoSucesso] = useState(false);

  // Match aluno with registered ward members by name
  const alunoNomeNorm = aluno.nome.toLowerCase().trim();
  const matchedMember = members.find(m => {
    const mNomeNorm = m.nome.toLowerCase().trim();
    return mNomeNorm === alunoNomeNorm || mNomeNorm.includes(alunoNomeNorm) || alunoNomeNorm.includes(mNomeNorm);
  });

  const handleCriarDesignacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    try {
      setSalvando(true);
      await api.post('/designacoes', {
        titulo: titulo.trim(),
        responsavel: responsavel.trim(),
        prazo,
        proximo: notas.trim() || `Frequência atual: ${aluno.freq != null ? `${aluno.freq}%` : '—'}, Aulas a recuperar: ${aluno.aulas || 0}`,
        origem: 'bispado',
        status: 'pendente',
      });
      setSalvoSucesso(true);
      setTimeout(() => {
        setSalvoSucesso(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar designação pastoral.');
    } finally {
      setSalvando(false);
    }
  };

  const isLow = aluno.freq != null && aluno.freq < 75;

  return (
    <div className="modal" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div
        className="sheet wide"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 620,
          background: 'var(--color-surface, #fff)',
          borderRadius: 'var(--radius, 12px)',
          padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: 14, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className={`sit sit-${aluno.situacao}`}>
                {aluno.situacao === 'credito'
                  ? 'Crédito'
                  : aluno.situacao === 'risco'
                  ? 'Em risco'
                  : 'Pendência'}
              </span>
              <span className={aluno.tipo.toLowerCase().includes('inst') ? 'tag-instituto' : 'tag-seminario'}>
                {aluno.tipo.toUpperCase()}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text)' }}>
              Acompanhamento Pastoral: {aluno.nome}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{ fontSize: '1.2rem', padding: '2px 8px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Student metrics card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: 10,
            padding: 12,
            background: 'var(--color-surface-hover, #f8fafc)',
            borderRadius: 8,
            border: '1px solid var(--color-border, #e2e8f0)',
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Frequência
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isLow ? '#dc2626' : 'var(--color-primary)' }}>
              {aluno.freq != null ? `${aluno.freq}%` : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Leitura
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {aluno.leitura != null ? `${aluno.leitura}%` : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Aulas a Recuperar
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: (aluno.aulas || 0) > 0 ? '#d97706' : 'var(--color-text)' }}>
              {aluno.aulas != null ? aluno.aulas : '0'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Avaliação
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>
              {aluno.avaliacao || '—'}
            </div>
          </div>
        </div>

        {/* Member matching info */}
        <div style={{ marginBottom: 18, padding: '10px 14px', background: 'var(--color-surface, #fff)', border: '1px dashed var(--color-border)', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {matchedMember ? '✓ Membro localizado no cadastro da ala' : '⚠️ Aluno não vinculado automaticamente'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {matchedMember
                  ? `${matchedMember.nome} · Chamado: ${matchedMember.chamado || 'Sem chamado'} · Tel: ${matchedMember.telefone || 'Sem telefone'}`
                  : 'Nenhum membro com nome exato encontrado no diretório de membros.'}
              </div>
            </div>
            {matchedMember && onOpenMember360 && (
              <button
                type="button"
                className="btn btn-secondary sm"
                onClick={() => {
                  onClose();
                  onOpenMember360(matchedMember);
                }}
                style={{ fontSize: '0.78rem' }}
              >
                Abrir Ficha 360°
              </button>
            )}
          </div>
        </div>

        {/* Pastoral Task Form */}
        <form onSubmit={handleCriarDesignacao}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 600 }}>
            📋 Atribuir Designação Pastoral no Bispado
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="label" style={{ fontSize: '0.78rem', marginBottom: 4, display: 'block' }}>
                Ação / Meta pastoral
              </label>
              <input
                type="text"
                className="input"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex.: Visitar família para plano de recuperação de frequência"
                required
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="label" style={{ fontSize: '0.78rem', marginBottom: 4, display: 'block' }}>
                  Líder Responsável
                </label>
                <select
                  className="input"
                  value={responsavel}
                  onChange={e => setResponsavel(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Bispo">Bispo</option>
                  <option value="1º Conselheiro">1º Conselheiro</option>
                  <option value="2º Conselheiro">2º Conselheiro</option>
                  <option value="Pres. Quórum de Élderes">Pres. Quórum de Élderes</option>
                  <option value="Pres. Sociedade de Socorro">Pres. Sociedade de Socorro</option>
                  <option value="Pres. Moças">Pres. Moças</option>
                  <option value="Professores do Seminário">Professores do Seminário</option>
                  <option value="Especialista do Instituto">Especialista do Instituto</option>
                </select>
              </div>

              <div>
                <label className="label" style={{ fontSize: '0.78rem', marginBottom: 4, display: 'block' }}>
                  Prazo
                </label>
                <input
                  type="date"
                  className="input"
                  value={prazo}
                  onChange={e => setPrazo(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" style={{ fontSize: '0.78rem', marginBottom: 4, display: 'block' }}>
                Observações Pastorais / Plano de Ação (Opcional)
              </label>
              <textarea
                className="input"
                rows={2}
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Ex.: Conversar com os pais sobre horários de trabalho e transporte para a capela..."
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={salvando || salvoSucesso}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {salvoSucesso ? (
                <>
                  <IconCheck size={16} color="#fff" /> Salvo com sucesso!
                </>
              ) : salvando ? (
                'Salvando designação...'
              ) : (
                'Criar Designação Pastoral'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
