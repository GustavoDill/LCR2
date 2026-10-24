import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { ORGANIZACOES_ALA } from '../Gerenciamento/gerenciamentoConstants';
import { IconCheck, IconShield, IconRefresh } from '../../components/Icons';

export const AwaitingApprovalView: React.FC = () => {
  const { user, logout, refreshProfile } = useAuth();

  const [cargo, setCargo] = useState(user?.solicitacaoAcesso?.cargo || user?.cargo || '');
  const [organizacao, setOrganizacao] = useState(
    user?.solicitacaoAcesso?.organizacao || user?.organizacao || 'Sociedade de Socorro'
  );
  const [justificativa, setJustificativa] = useState(user?.solicitacaoAcesso?.justificativa || '');

  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    try {
      await api.post('/api/auth/request-access', {
        cargo,
        organizacao,
        justificativa,
      });

      setSucesso(true);
      await refreshProfile();
      setTimeout(() => setSucesso(false), 6000);
    } catch (err: any) {
      setErro(err.message || 'Falha ao enviar solicitação ao Bispado. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const handleVerificarAcesso = async () => {
    setVerificando(true);
    setErro(null);
    try {
      await refreshProfile();
    } catch (err: any) {
      setErro('Não foi possível verificar no momento.');
    } finally {
      setVerificando(false);
    }
  };

  const jaEnviou = Boolean(user?.solicitacaoAcesso?.solicitadoEm);
  const dataFormatada = user?.solicitacaoAcesso?.solicitadoEm
    ? new Date(user.solicitacaoAcesso.solicitadoEm).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg, #f1f5f9)',
        padding: '24px 16px',
        fontFamily: 'inherit',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 580,
          background: 'var(--color-surface, #ffffff)',
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
          border: '1px solid var(--color-border, #e2e8f0)',
          overflow: 'hidden',
        }}
      >
        {/* Header with Church / Ward Branding */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            color: '#ffffff',
            padding: '28px 28px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              marginBottom: 12,
            }}
          >
            <IconShield size={28} color="#ffffff" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Ala Bosque · Gestão Pastoral
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.9 }}>
            Aguardando Liberação de Permissões
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: '28px 28px 24px' }}>
          {/* Welcome and status message */}
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              borderLeft: '4px solid #2563eb',
              padding: '14px 16px',
              borderRadius: '0 8px 8px 0',
              marginBottom: 20,
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--color-text, #1e293b)', fontSize: '0.94rem' }}>
              Olá, {user?.displayName || user?.name || user?.email || 'Líder'}!
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted, #475569)', marginTop: 4, lineHeight: 1.5 }}>
              Sua conta foi registrada com sucesso. Por privacidade e governança dos registros da congregação, novos usuários não possuem permissões de acesso por padrão.
            </div>
          </div>

          {jaEnviou && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <IconCheck size={18} color="#16a34a" />
              <div style={{ fontSize: '0.84rem', color: '#166534', lineHeight: 1.45 }}>
                <strong>Solicitação registrada em {dataFormatada}.</strong>
                <br />
                Os administradores foram notificados por e-mail via SMTP. Você pode atualizar seus dados abaixo caso necessário.
              </div>
            </div>
          )}

          {sucesso && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 20,
                color: '#166534',
                fontSize: '0.86rem',
                fontWeight: 500,
              }}
            >
              ✅ Sua solicitação foi enviada aos administradores por e-mail com sucesso!
            </div>
          )}

          {erro && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 20,
                color: '#991b1b',
                fontSize: '0.86rem',
              }}
            >
              ⚠️ {erro}
            </div>
          )}

          {/* Request Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label" style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Qual o seu chamado ou encargo na Ala? *
              </label>
              <input
                type="text"
                className="input"
                placeholder="Ex: 1ª Conselheira da Sociedade de Socorro, Secretário, etc."
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="label" style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Sua Organização *
              </label>
              <select
                className="input"
                value={organizacao}
                onChange={e => setOrganizacao(e.target.value)}
                style={{ width: '100%' }}
              >
                {ORGANIZACOES_ALA.map(org => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Mensagem ou Justificativa ao Bispado (Opcional)
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Ex: Fui apoiada no último domingo e preciso de acesso para visualizar e planejar as atividades da organização..."
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={enviando}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '0.95rem',
                fontWeight: 600,
                marginTop: 6,
              }}
            >
              {enviando
                ? 'Enviando ao Bispado...'
                : jaEnviou
                ? 'Atualizar Solicitação de Acesso'
                : 'Enviar Solicitação de Acesso ao Bispado'}
            </button>
          </form>

          {/* Quick Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid var(--color-border, #e2e8f0)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary sm"
              onClick={handleVerificarAcesso}
              disabled={verificando}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
            >
              <IconRefresh size={14} />
              {verificando ? 'Verificando...' : 'Verificar se já foi aprovado'}
            </button>

            <button
              type="button"
              className="btn btn-secondary sm"
              onClick={logout}
              style={{ color: 'var(--color-danger, #dc2626)', fontSize: '0.82rem' }}
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AwaitingApprovalView;
