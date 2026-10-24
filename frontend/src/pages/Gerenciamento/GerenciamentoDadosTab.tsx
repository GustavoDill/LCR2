import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { IconDatabase, IconCheck, IconDownload, IconUpload, IconSparkles } from '../../components/Icons';
import { MembrosImportModal } from '../Membros/MembrosImportModal';

interface DatabaseStats {
  membrosCount: number;
  chamadosCount: number;
  atasCount: number;
  designacoesCount: number;
  atividadesCount: number;
  agendaCount: number;
  financeiroCount: number;
  loading: boolean;
}

export const GerenciamentoDadosTab: React.FC = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const [stats, setStats] = useState<DatabaseStats>({
    membrosCount: 0,
    chamadosCount: 0,
    atasCount: 0,
    designacoesCount: 0,
    atividadesCount: 0,
    agendaCount: 0,
    financeiroCount: 0,
    loading: true,
  });

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      const [membrosRes, chamadosRes, atasRes, desigRes, atvRes, agendaRes, finRes] = await Promise.all([
        api.get<{ members: any[] }>('/membros').catch(() => ({ members: [] })),
        api.get<any[]>('/chamados/organizacoes').catch(() => []),
        api.get<any[]>('/atas').catch(() => []),
        api.get<any[]>('/designacoes').catch(() => []),
        api.get<any[]>('/atividades').catch(() => []),
        api.get<any[]>('/agenda').catch(() => []),
        api.get<{ lancamentos: any[] }>('/financeiro/data').catch(() => ({ lancamentos: [] })),
      ]);

      let totalCargos = 0;
      (chamadosRes || []).forEach(org => {
        totalCargos += (org.cargos || []).length;
      });

      setStats({
        membrosCount: membrosRes.members?.length || 0,
        chamadosCount: totalCargos,
        atasCount: atasRes?.length || 0,
        designacoesCount: desigRes?.length || 0,
        atividadesCount: atvRes?.length || 0,
        agendaCount: agendaRes?.length || 0,
        financeiroCount: finRes.lancamentos?.length || 0,
        loading: false,
      });
    } catch (err) {
      console.error('Erro ao carregar estatísticas do banco:', err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSeed = async () => {
    if (!confirm('Deseja inicializar a estrutura padrão da Ala (organizações e cargos padrão do manual)?')) return;
    try {
      setSeeding(true);
      const res = await api.post<{ success: boolean; message: string }>('/api/seed/init', {});
      setSeedResult(res.message || 'Estrutura inicial criada com sucesso!');
      carregarEstatisticas();
      setTimeout(() => setSeedResult(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Erro ao inicializar estrutura');
    } finally {
      setSeeding(false);
    }
  };

  const handleImportSubmit = async (records: any[], removeUnlisted: boolean) => {
    try {
      setImporting(true);
      const res = await api.post<{ total: number }>('/membros/import', {
        records,
        removeUnlisted,
      });
      alert(`Importação concluída com sucesso! ${res.total} membros na lista.`);
      setIsImportModalOpen(false);
      carregarEstatisticas();
    } catch (err: any) {
      alert(err.message || 'Erro na importação de membros');
    } finally {
      setImporting(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      setExporting(true);
      const [membrosRes, chamadosRes, atasRes, desigRes, atvRes, agendaRes, finRes] = await Promise.all([
        api.get<{ members: any[] }>('/membros').catch(() => ({ members: [] })),
        api.get<any[]>('/chamados/organizacoes').catch(() => []),
        api.get<any[]>('/atas').catch(() => []),
        api.get<any[]>('/designacoes').catch(() => []),
        api.get<any[]>('/atividades').catch(() => []),
        api.get<any[]>('/agenda').catch(() => []),
        api.get<any>('/financeiro/data').catch(() => ({})),
      ]);

      const backupData = {
        versao: '2.0',
        geradoEm: new Date().toISOString(),
        ala: 'Ala Bosque',
        banco: 'Google Cloud Firestore lcr2-db541',
        dados: {
          membros: membrosRes.members || [],
          chamados: chamadosRes || [],
          atas: atasRes || [],
          designacoes: desigRes || [],
          atividades: atvRes || [],
          agenda: agendaRes || [],
          financeiro: finRes || {},
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-ala-bosque-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar arquivo de backup.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Card 1: Importação de Membros */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '1.4rem' }}>📥</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Importação do LCR</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0 0 16px 0', lineHeight: 1.45 }}>
              Atualize a congregação importando o relatório <code>Members.html</code> ou dados copiados em tabela do portal oficial LCR da Igreja.
            </p>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
              Status: <strong>{stats.membrosCount} membros ativos</strong> no banco
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsImportModalOpen(true)}
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <IconUpload size={16} /> Importar Relatório LCR
            </button>
          </div>
        </div>

        {/* Card 2: Estrutura Inicial */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '1.4rem' }}>🏛️</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Estrutura de Organizações</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0 0 16px 0', lineHeight: 1.45 }}>
              Inicialize a estrutura canônica de chamados: Bispado, Quórum de Élderes, Sociedade de Socorro, Moças, Primária e Escola Dominical.
            </p>
          </div>
          <div>
            {seedResult && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', marginBottom: 8 }}>
                ✓ {seedResult}
              </div>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSeed}
              disabled={seeding}
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <IconSparkles size={16} /> {seeding ? 'Inicializando...' : 'Inicializar Estrutura Padrão'}
            </button>
          </div>
        </div>

        {/* Card 3: Backup Global */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '1.4rem' }}>💾</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Backup Global dos Dados</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0 0 16px 0', lineHeight: 1.45 }}>
              Exporte todos os registros em arquivo JSON para cópia de segurança física e auditoria de registros da ala.
            </p>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExportBackup}
              disabled={exporting}
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <IconDownload size={16} /> {exporting ? 'Gerando backup...' : 'Exportar Backup Consolidado'}
            </button>
          </div>
        </div>
      </div>

      {/* Database Health and Statistics Section */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconDatabase size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Diagnóstico e Auditoria do Banco de Dados</h3>
          </div>
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            Cloud Firestore Conectado (lcr2-db541)
          </span>
        </div>

        {stats.loading ? (
          <div style={{ color: 'var(--color-text-muted)', padding: '16px 0' }}>Consultando coleções do Firestore...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div style={{ padding: 14, background: 'var(--color-surface-hover)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Membros</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>{stats.membrosCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Registros completos</div>
            </div>

            <div style={{ padding: 14, background: 'var(--color-surface-hover)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Chamados na Ala</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>{stats.chamadosCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Cargos mapeados</div>
            </div>

            <div style={{ padding: 14, background: 'var(--color-surface-hover)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Histórico de Atas</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>{stats.atasCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Reuniões arquivadas</div>
            </div>

            <div style={{ padding: 14, background: 'var(--color-surface-hover)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Designações</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>{stats.designacoesCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Tarefas em aberto</div>
            </div>

            <div style={{ padding: 14, background: 'var(--color-surface-hover)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Atividades</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>{stats.atividadesCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Propostas registradas</div>
            </div>

            <div style={{ padding: 14, background: 'var(--color-surface-hover)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Agenda</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>{stats.agendaCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Eventos agendados</div>
            </div>

            <div style={{ padding: 14, background: 'var(--color-surface-hover)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Financeiro</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>{stats.financeiroCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Despesas lançadas</div>
            </div>
          </div>
        )}
      </div>

      <MembrosImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportSubmit}
        importing={importing}
      />
    </div>
  );
};
