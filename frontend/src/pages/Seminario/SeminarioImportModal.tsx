import React, { useState } from 'react';
import { SIRAluno } from '../../types';
import { parseImportLines } from './seminarioUtils';

interface SeminarioImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (payload: { data: string; semestre: string; alunos: SIRAluno[] }) => Promise<void>;
}

export const SeminarioImportModal: React.FC<SeminarioImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [importData, setImportData] = useState(new Date().toISOString().split('T')[0]);
  const [importSemestre, setImportSemestre] = useState('2º semestre 2026');
  const [importText, setImportText] = useState('');
  const [importSubmitting, setImportSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!importText.trim()) return;

    try {
      setImportSubmitting(true);
      const newAlunos = parseImportLines(importText);

      if (newAlunos.length === 0) {
        alert('Não foi possível identificar alunos nas linhas coladas.');
        return;
      }

      await onImport({
        data: importData,
        semestre: importSemestre,
        alunos: newAlunos,
      });

      setImportText('');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao importar alunos.');
    } finally {
      setImportSubmitting(false);
    }
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <h3>Importar relatório de alunos (SIR)</h3>
        <p className="sub" style={{ fontSize: '13px', color: 'var(--muted)', marginTop: -6 }}>
          Cole os dados do relatório do Seminário e Instituto abaixo (separados por tabulação ou vírgula):
        </p>

        <form onSubmit={handleFormSubmit} className="form" style={{ marginTop: 12 }}>
          <div className="two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Data do relatório</label>
              <input
                className="inp"
                type="date"
                value={importData}
                onChange={e => setImportData(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Semestre de referência</label>
              <input
                className="inp"
                value={importSemestre}
                onChange={e => setImportSemestre(e.target.value)}
                placeholder="Ex.: 2º semestre 2026"
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Linhas copiadas (Aluno, Tipo, Freq, Leitura, Aulas, Avaliação)</label>
            <textarea
              className="inp"
              rows={8}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Nome do Aluno	Seminário	80%	75%	2	Feita"
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
              required
            />
          </div>

          <div className="foot" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <div className="btns">
              <button type="submit" className="btn pri" disabled={importSubmitting}>
                {importSubmitting ? 'Importando…' : 'Salvar relatório'}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={onClose}
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
