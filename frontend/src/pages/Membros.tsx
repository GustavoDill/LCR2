import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Membro, MembroMeta } from '../types';
import { parseMembersHtml } from '../utils/membersParser';

export const Membros: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [members, setMembers] = useState<Membro[]>([]);
  const [meta, setMeta] = useState<MembroMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'todos' | 'M' | 'F'>('todos');
  const [categoryFilter, setCategoryFilter] = useState<'todos' | 'adultos' | 'jovens' | 'criancas' | 'semchamado'>('todos');
  const [limit, setLimit] = useState(60);

  // Single Member Form Modal
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Membro | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formSexo, setFormSexo] = useState<'M' | 'F' | ''>('');
  const [formNascimento, setFormNascimento] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEndereco, setFormEndereco] = useState('');
  const [formChamado, setFormChamado] = useState('');
  const [formObs, setFormObs] = useState('');

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [flipNames, setFlipNames] = useState(false);
  const [removeUnlisted, setRemoveUnlisted] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [isBishopric]);

  async function loadMembers() {
    try {
      const res = await api.get<{ members: Membro[]; meta: MembroMeta }>('/membros');
      setMembers(res.members || []);
      setMeta(res.meta || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openNewMemberModal() {
    setEditingMember(null);
    setFormNome('');
    setFormSexo('');
    setFormNascimento('');
    setFormTelefone('');
    setFormEmail('');
    setFormEndereco('');
    setFormChamado('');
    setFormObs('');
    setIsMemberModalOpen(true);
  }

  function openEditMemberModal(m: Membro) {
    setEditingMember(m);
    setFormNome(m.nome);
    setFormSexo(m.sexo || '');
    setFormNascimento(m.nascimento || '');
    setFormTelefone(m.telefone || '');
    setFormEmail(m.email || '');
    setFormEndereco(m.endereco || '');
    setFormChamado(m.chamado || '');
    setFormObs(m.obs || '');
    setIsMemberModalOpen(true);
  }

  async function handleMemberSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formNome.trim()) return alert('O nome é obrigatório.');

    try {
      const payload = {
        nome: formNome,
        sexo: formSexo,
        nascimento: formNascimento,
        telefone: formTelefone,
        email: formEmail,
        endereco: formEndereco,
        chamado: formChamado,
        obs: formObs,
      };

      if (editingMember) {
        await api.put(`/membros/${editingMember.id}`, payload);
      } else {
        await api.post('/membros', payload);
      }

      setIsMemberModalOpen(false);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar membro');
    }
  }

  async function handleMemberDelete(id: string) {
    if (!confirm('Deseja excluir este membro da lista?')) return;
    try {
      await api.delete(`/membros/${id}`);
      setIsMemberModalOpen(false);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir membro');
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPasteData(content);
      }
    };
    reader.readAsText(file);
  }

  // Raw text, TSV/CSV or HTML parser
  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteData.trim()) return alert('Selecione um arquivo ou cole os dados.');

    setImporting(true);
    try {
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
        setImporting(false);
        return;
      }

      const res = await api.post('/membros/import', {
        records: parsedRecords,
        removeUnlisted,
      });

      alert(`Importação concluída com sucesso! ${res.total} membros na lista.`);
      setIsImportModalOpen(false);
      setPasteData('');
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Erro na importação de membros');
    } finally {
      setImporting(false);
    }
  }

  const ageOf = (m: Membro) => {
    if (m.nascimento && /^\d{4}-\d{2}-\d{2}$/.test(m.nascimento)) {
      const [y, mm, d] = m.nascimento.split('-').map(Number);
      const b = new Date(y, mm - 1, d);
      const n = new Date();
      let a = n.getFullYear() - b.getFullYear();
      if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
      return a;
    }
    const i = parseInt(String(m.idade || ''), 10);
    return isFinite(i) ? i : null;
  };

  const ageGroup = (m: Membro) => {
    const a = ageOf(m);
    if (a == null) return '';
    if (a < 12) return 'criancas';
    if (a < 18) return 'jovens';
    return 'adultos';
  };

  if (!isBishopric) {
    return <div className="notice bisp">Acesso restrito aos membros do Bispado.</div>;
  }

  if (loading) {
    return <div className="empty">Carregando lista de membros…</div>;
  }

  const totalAdultos = members.filter(m => ageGroup(m) === 'adultos').length;
  const totalJovens = members.filter(m => ageGroup(m) === 'jovens').length;
  const totalCriancas = members.filter(m => ageGroup(m) === 'criancas').length;
  const semChamado = members.filter(m => ageGroup(m) === 'adultos' && !m.chamado?.trim()).length;

  const q = search.toLowerCase().trim();
  const filtered = members.filter(m => {
    if (genderFilter !== 'todos' && m.sexo !== genderFilter) return false;
    if (categoryFilter === 'adultos' && ageGroup(m) !== 'adultos') return false;
    if (categoryFilter === 'jovens' && ageGroup(m) !== 'jovens') return false;
    if (categoryFilter === 'criancas' && ageGroup(m) !== 'criancas') return false;
    if (categoryFilter === 'semchamado' && (ageGroup(m) !== 'adultos' || m.chamado?.trim())) return false;
    if (q) {
      const txt = `${m.nome} ${m.chamado || ''} ${m.telefone || ''}`.toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Membros</h2>
          <p className="sub">
            Lista da ala para acompanhamento e indicação de chamados. Somente o bispado vê esta página.
          </p>
        </div>
        {canWrite && (
          <div className="btns">
            <button type="button" className="btn bisp" onClick={() => setIsImportModalOpen(true)}>
              Importar lista
            </button>
            <button type="button" className="btn" onClick={openNewMemberModal}>
              + Membro
            </button>
          </div>
        )}
      </div>

      <div className="stats">
        <div className="stat">
          <div className="v num">{members.length}</div>
          <div className="l">membros na lista</div>
          <div className="x">{meta?.total ? `total: ${meta.total}` : 'cadastro regular'}</div>
        </div>

        <div className="stat">
          <div className="v num">{totalAdultos}</div>
          <div className="l">adultos</div>
          <div className="x">{totalJovens} jovens · {totalCriancas} crianças</div>
        </div>

        <div className="stat">
          <div className="v num">{semChamado}</div>
          <div className="l">adultos sem chamado</div>
          <div className="x">possíveis indicações</div>
        </div>
      </div>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="searchbar">
          <input
            className="inp"
            type="search"
            placeholder="Buscar por nome, chamado ou telefone"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="chips">
            {(
              [
                ['todos', 'Todos'],
                ['M', 'Homens'],
                ['F', 'Mulheres'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`chip ${genderFilter === val ? 'on' : ''}`}
                onClick={() => setGenderFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="chips">
          {(
            [
              ['todos', 'Todos', members.length],
              ['adultos', 'Adultos', totalAdultos],
              ['jovens', 'Jovens 12–17', totalJovens],
              ['criancas', 'Crianças', totalCriancas],
              ['semchamado', 'Adultos sem chamado', semChamado],
            ] as const
          ).map(([val, label, n]) => (
            <button
              key={val}
              type="button"
              className={`chip ${categoryFilter === val ? 'on' : ''}`}
              onClick={() => setCategoryFilter(val)}
            >
              {label} <span className="c num">{n}</span>
            </button>
          ))}
        </div>

        {filtered.length ? (
          <div className="list">
            {filtered.slice(0, limit).map(m => {
              const age = ageOf(m);
              return (
                <div key={m.id} className="row">
                  <div className="row-main">
                    <div className="row-t" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{m.nome}</span>
                      {m.nomeOriginal && m.nomeOriginal !== m.nome && (
                        <span style={{ color: 'var(--muted)', fontSize: '11.5px', fontWeight: 'normal' }}>
                          ({m.nomeOriginal})
                        </span>
                      )}
                    </div>
                    <div className="row-m">
                      {age != null && <span>{age} anos</span>}
                      {m.sexo && <span>{m.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>}
                      {m.nascimento && <span>📅 {m.nascimento}</span>}
                      {m.telefone && (
                        <span>
                          <a href={`tel:${m.telefone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            📞 {m.telefone}
                          </a>
                        </span>
                      )}
                      {m.email && (
                        <span>
                          <a href={`mailto:${m.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            ✉️ {m.email}
                          </a>
                        </span>
                      )}
                      <span>{m.chamado ? m.chamado : 'Sem chamado'}</span>
                    </div>
                  </div>

                  {canWrite && (
                    <div className="acts">
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => openEditMemberModal(m)}
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty" style={{ marginBlock: 12 }}>
            Nenhum membro encontrado com os filtros selecionados.
          </div>
        )}

        {filtered.length > limit && (
          <button
            type="button"
            className="btn ghost sm"
            style={{ marginTop: 8 }}
            onClick={() => setLimit(l => l + 60)}
          >
            Mostrar mais ({filtered.length - limit} restantes)
          </button>
        )}
      </section>

      {/* Modal: Adicionar / Editar Membro */}
      {isMemberModalOpen && (
        <div className="modal" onClick={() => setIsMemberModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>{editingMember ? 'Editar membro' : 'Novo membro'}</h3>
            <form onSubmit={handleMemberSubmit} className="form">
              <div className="field">
                <label>Nome completo *</label>
                <input
                  className="inp"
                  value={formNome}
                  onChange={e => setFormNome(e.target.value)}
                  required
                />
              </div>

              <div className="two">
                <div className="field">
                  <label>Sexo</label>
                  <select
                    className="inp"
                    value={formSexo}
                    onChange={e => setFormSexo(e.target.value as any)}
                  >
                    <option value="">—</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>

                <div className="field">
                  <label>Data de nascimento</label>
                  <input
                    className="inp"
                    type="date"
                    value={formNascimento}
                    onChange={e => setFormNascimento(e.target.value)}
                  />
                </div>
              </div>

              <div className="two">
                <div className="field">
                  <label>Telefone</label>
                  <input
                    className="inp"
                    value={formTelefone}
                    onChange={e => setFormTelefone(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>E-mail</label>
                  <input
                    className="inp"
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>Chamado atual</label>
                <input
                  className="inp"
                  value={formChamado}
                  onChange={e => setFormChamado(e.target.value)}
                  placeholder="Deixe em branco se não tiver chamado"
                />
              </div>

              <div className="field">
                <label>Endereço</label>
                <input
                  className="inp"
                  value={formEndereco}
                  onChange={e => setFormEndereco(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Observações</label>
                <textarea
                  className="inp"
                  value={formObs}
                  onChange={e => setFormObs(e.target.value)}
                />
              </div>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Salvar
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsMemberModalOpen(false)}>
                    Cancelar
                  </button>
                </div>

                {editingMember && (
                  <button
                    type="button"
                    className="btn ghost danger"
                    onClick={() => handleMemberDelete(editingMember.id)}
                  >
                    Excluir
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Importar Lista */}
      {isImportModalOpen && (
        <div className="modal" onClick={() => setIsImportModalOpen(false)}>
          <div className="sheet wide" onClick={e => e.stopPropagation()}>
            <h3>Importar lista de membros</h3>
            <p className="sub" style={{ marginTop: -8 }}>
              Suporta arquivos <b>Members.html</b> do LCR, planilhas CSV ou linhas copiadas do Excel (TSV).
            </p>

            <form onSubmit={handleImportSubmit} className="form" style={{ marginTop: 12 }}>
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
                  <button type="button" className="btn ghost" onClick={() => setIsImportModalOpen(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
