import { useState } from 'react';
import { Supplier } from '../types';
import { addSupplier, updateSupplier, deleteSupplier } from '../store';
import { showToast } from './Toast';

interface Props {
  suppliers: Supplier[];
  onRefresh: () => void;
}

const EMPTY: Omit<Supplier, 'id' | 'createdAt'> = { name: '', cnpj: '', phone: '', email: '', address: '' };

function maskCNPJ(v: string) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function maskPhone(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export default function Suppliers({ suppliers, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<Omit<Supplier, 'id' | 'createdAt'>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.cnpj.includes(search) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setForm(EMPTY); setEditId(null); setModal('add'); }
  function openEdit(s: Supplier) {
    setForm({ name: s.name, cnpj: s.cnpj, phone: s.phone, email: s.email, address: s.address });
    setEditId(s.id); setModal('edit');
  }

  function handleSubmit() {
    if (!form.name.trim()) { showToast('Informe o nome da empresa', 'error'); return; }
    if (editId) { updateSupplier(editId, form); showToast('Fornecedor atualizado!'); }
    else { addSupplier(form); showToast('Fornecedor cadastrado!'); }
    setModal(null); onRefresh();
  }

  function handleDelete() {
    if (deleteId) { deleteSupplier(deleteId); showToast('Fornecedor removido', 'warning'); setDeleteId(null); onRefresh(); }
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-header-stripe">
            <div className="card-stripe" />
            <div>
              <div className="card-title">Fornecedores</div>
              <div className="card-subtitle">{suppliers.length} fornecedor(es) cadastrado(s)</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Novo Fornecedor</button>
        </div>

        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)' }}>
          <div className="search-bar" style={{ maxWidth: 360 }}>
            <span className="search-icon">🔍</span>
            <input placeholder="Buscar por nome, CNPJ ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} type="search" />
          </div>
        </div>

        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">🏭</div>
              <p>{search ? 'Nenhum fornecedor encontrado' : 'Cadastre seu primeiro fornecedor'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>CNPJ</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Endereço</th>
                  <th style={{ width: 80 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.cnpj || '—'}</td>
                    <td>{s.phone || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.email || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" title="Editar" onClick={() => openEdit(s)}>✏️</button>
                        <button className="btn-icon" title="Excluir" onClick={() => setDeleteId(s.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal === 'add' ? '🏭 Novo Fornecedor' : '✏️ Editar Fornecedor'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome da Empresa *</label>
                <input placeholder="Ex: Distribuidora Alimentos Ltda" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>CNPJ</label>
                  <input placeholder="00.000.000/0001-00" value={form.cnpj}
                    onChange={e => setForm(f => ({ ...f, cnpj: maskCNPJ(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label>Telefone</label>
                  <input placeholder="(00) 00000-0000" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))} />
                </div>
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input type="email" placeholder="contato@empresa.com.br" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Endereço</label>
                <input placeholder="Rua, Número, Bairro - Cidade, UF" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{modal === 'add' ? 'Cadastrar' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h3>🗑️ Confirmar exclusão</h3>
              <button className="modal-close" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Tem certeza que deseja excluir este fornecedor?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
