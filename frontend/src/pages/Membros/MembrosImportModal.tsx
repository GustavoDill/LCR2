import React, { useState } from 'react';
import { parseMembersHtml } from '../../utils/membersParser';

interface MembrosImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (records: any[], removeUnlisted: boolean) => Promise<void>;
  importing: boolean;
}

export const MembrosImportModal: React.FC<MembrosImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  importing,
}) => {
  const [pasteData, setPasteData] = useState('');
  const [flipNames, setFlipNames] = useState(false);
  const [removeUnlisted, setRemoveUnlisted] = useState(false);

  if (!isOpen) return null;

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        setPasteData(content);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteData.trim()) {
      alert('Selecione um arquivo ou cole os dados.');
      return;
    }

    let parsedRecords: any[] = [];

    // Check if user pasted/loaded HTML from LCR
    if (pasteData.includes('<tr') || pasteData.includes('cloned-column-header') || pasteData.includes('<table')) {
      parsedRecords = parseMembersHtml(pasteData);
    } else {
      const lines = pasteData.trim().split('\n');
      const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';

      // Check if header row is present
      const hasHeader = lines[0].toLowerCase().includes('nome');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      parsedRecords = dataLines
        .map(line => {
          const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
          let nome = cols[0] || '';
          if (flipNames && nome.includes(',')) {
            const parts = nome.split(',');
            if (parts.length === 2) nome = `${parts[1].trim()} ${parts[0].trim()}`;
          }
          if (!nome || nome.toLowerCase() === 'nome') return null;

          return {
            nome,
            sexo: cols[1]?.startsWith('M') ? 'M' : cols[1]?.startsWith('F') ? 'F' : '',
            nascimento: cols[2] || '',
            telefone: cols[3] || '',
            email: cols[4] && cols[4].includes('@') ? cols[4] : '',
            chamado: cols[4] && !cols[4].includes('@') ? cols[4] : '',
            idade: cols[5] ? Number(cols[5]) : undefined,
            nomeOriginal: cols[6] || undefined,
          };
        })
        .filter(Boolean);
    }

    if (!parsedRecords.length) {
      alert('Nenhum registro válido encontrado. Verifique o formato do arquivo.');
      return;
    }

    await onImport(parsedRecords, removeUnlisted);
    setPasteData('');
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet wide" onClick={e => e.stopPropagation()}>
        <h3>Importar lista de membros</h3>
        <p className="sub" style={{ marginTop: -8 }}>
          Suporta arquivos <b>Members.html</b> do LCR, planilhas CSV ou linhas copiadas do Excel (TSV).
        </p>

        <form onSubmit={handleSubmit} className="form" style={{ marginTop: 12 }}>
          <div className="field">
            <label>Carregar arquivo do computador (HTML, CSV ou TSV)</label>
            <input
              type="file"
              accept=".html,.htm,.csv,.tsv,.txt"
              className="inp"
              onChange={handleFileSelected}
            />
          </div>

          <div className="field">
            <label>Ou cole os dados diretamente aqui</label>
            <textarea
              className="inp"
              style={{ minHeight: 140, fontFamily: 'monospace', fontSize: 12.5 }}
              value={pasteData}
              onChange={e => setPasteData(e.target.value)}
              placeholder="Cole aqui o conteúdo de Members.html ou linhas copiadas do Excel/CSV..."
              required
            />
          </div>

          <label className="chk">
            <input
              type="checkbox"
              checked={flipNames}
              onChange={e => setFlipNames(e.target.checked)}
            />
            Converter &ldquo;Sobrenome, Nome&rdquo; para &ldquo;Nome Sobrenome&rdquo;
          </label>

          <label className="chk">
            <input
              type="checkbox"
              checked={removeUnlisted}
              onChange={e => setRemoveUnlisted(e.target.checked)}
            />
            Remover da lista quem não estiver neste arquivo
          </label>

          <div className="foot">
            <div className="btns">
              <button type="submit" className="btn pri" disabled={importing}>
                {importing ? 'Importando…' : 'Processar importação'}
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
