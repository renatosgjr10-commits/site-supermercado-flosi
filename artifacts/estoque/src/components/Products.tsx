import { useState } from 'react';
import { Product, UNITS, getCategories, saveCategories } from '../types';
import { addProduct, updateProduct, deleteProduct, getSuppliers } from '../store';
import { showToast } from './Toast';

interface Props {
  products: Product[];
  onRefresh: () => void;
}

function getStockStatus(p: Product) {
  if (p.quantity === 0) return { label: 'Sem estoque', cls: 'badge-danger' };
  if (p.quantity <= p.minQuantity) return { label: 'Estoque baixo', cls: 'badge-warning' };
  return { label: 'Normal', cls: 'badge-success' };
}

function fmtR(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function getBarColor(p: Product) {
  if (p.quantity === 0) return '#c8102e';
  if (p.quantity <= p.minQuantity) return '#d97706';
  return '#16a34a';
}

function getExpiryClass(date: string) {
  if (!date) return '';
  const diff = (new Date(date).getTime() - Date.now()) / 86400000;
  if (diff < 0) return 'expiry-expired';
  if (diff <= 7) return 'expiry-soon';
  return '';
}

const EMPTY_FORM = {
  name: '', sku: '', category: 'alimentos', quantity: 0, minQuantity: 5,
  purchasePrice: 0, salePrice: 0, unit: 'un', supplierId: '', expirationDate: ''
};

export default function Products({ products, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | 'categories' | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [categories, setCategories] = useState(getCategories);
  const [newCatName, setNewCatName] = useState('');

  const suppliers = getSuppliers();

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCat = catFilter ? p.category === catFilter : true;
    return matchSearch && matchCat;
  });

  function openAdd() {
    setForm({ ...EMPTY_FORM, category: categories[0]?.id || 'outros' });
    setEditId(null); setModal('add');
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name, sku: p.sku, category: p.category, quantity: p.quantity, minQuantity: p.minQuantity,
      purchasePrice: p.purchasePrice, salePrice: p.salePrice, unit: p.unit,
      supplierId: p.supplierId, expirationDate: p.expirationDate
    });
    setEditId(p.id); setModal('edit');
  }

  function handleSubmit() {
    if (!form.name.trim()) { showToast('Informe o nome do produto', 'error'); return; }
    if (!form.sku.trim()) { showToast('Informe o código do produto', 'error'); return; }
    if (editId) { updateProduct(editId, form); showToast('Produto atualizado!'); }
    else { addProduct(form); showToast('Produto cadastrado com sucesso!'); }
    setModal(null); onRefresh();
  }

  function handleDelete() {
    if (deleteId) { deleteProduct(deleteId); showToast('Produto removido', 'warning'); setDeleteId(null); onRefresh(); }
  }

  function addCategory() {
    if (!newCatName.trim()) return;
    const id = newCatName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (categories.find(c => c.id === id)) { showToast('Categoria já existe', 'error'); return; }
    const updated = [...categories, { id, label: newCatName.trim(), emoji: '📦' }];
    setCategories(updated);
    saveCategories(updated);
    setNewCatName('');
    showToast(`Categoria "${newCatName.trim()}" adicionada!`);
  }

  function removeCategory(id: string) {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    saveCategories(updated);
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-header-stripe">
            <div className="card-stripe" />
            <div>
              <div className="card-title">Cadastro de Produtos</div>
              <div className="card-subtitle">{products.length} produto(s) cadastrado(s)</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setCategories(getCategories()); setModal('categories'); }}>
              🗂 Categorias
            </button>
            <button className="btn btn-primary" onClick={openAdd}>+ Novo Produto</button>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)' }}>
          <div className="toolbar">
            <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
              <span className="search-icon">🔍</span>
              <input placeholder="Buscar Produtos..." value={search} onChange={e => setSearch(e.target.value)} type="search" />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 180 }}>
              <option value="">Todas as categorias</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">📦</div>
              <p>{search || catFilter ? 'Nenhum produto encontrado' : 'Cadastre seu primeiro produto'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Produto / Código</th>
                  <th>Categoria</th>
                  <th>Estoque</th>
                  <th>Preço Compra</th>
                  <th>Preço Venda</th>
                  <th>Validade</th>
                  <th>Situação</th>
                  <th style={{ width: 90 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const status = getStockStatus(p);
                  const pct = p.minQuantity > 0 ? Math.min(100, (p.quantity / (p.minQuantity * 3)) * 100) : 100;
                  const cat = categories.find(c => c.id === p.category);
                  const expiryClass = getExpiryClass(p.expirationDate);
                  const supplier = suppliers.find(s => s.id === p.supplierId);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</div>
                        {supplier && <div style={{ fontSize: 10, color: 'var(--navy)', marginTop: 2 }}>🏭 {supplier.name}</div>}
                      </td>
                      <td>
                        <span className="category-chip">{cat?.emoji || '📦'} {cat?.label || p.category}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{p.quantity} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.unit}</span></div>
                        <div className="stock-bar" style={{ width: 80 }}>
                          <div className="stock-bar-fill" style={{ width: `${pct}%`, background: getBarColor(p) }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>mín: {p.minQuantity}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{fmtR(p.purchasePrice)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{fmtR(p.salePrice)}</td>
                      <td>
                        {p.expirationDate
                          ? <span className={expiryClass || ''} style={{ fontSize: 12 }}>
                              {new Date(p.expirationDate).toLocaleDateString('pt-BR')}
                              {expiryClass === 'expiry-expired' && ' ⚠ Vencido'}
                              {expiryClass === 'expiry-soon' && ' ⚠ Próximo'}
                            </span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-icon" title="Editar" onClick={() => openEdit(p)}>✏️</button>
                          <button className="btn-icon" title="Excluir" onClick={() => setDeleteId(p.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{modal === 'add' ? '➕ Novo Produto' : '✏️ Editar Produto'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome do Produto *</label>
                <input placeholder="Ex: Arroz Tipo 1 (5kg)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Código do Produto *</label>
                  <input placeholder="Ex: ALI-001" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Categoria</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Preço de Compra (R$)</label>
                  <input type="number" min={0} step={0.01} value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label>Preço de Venda (R$)</label>
                  <input type="number" min={0} step={0.01} value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Qtd. em Estoque</label>
                  <input type="number" min={0} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label>Qtd. Mínima</label>
                  <input type="number" min={0} value={form.minQuantity} onChange={e => setForm(f => ({ ...f, minQuantity: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Unidade</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Data de Validade (opcional)</label>
                  <input type="date" value={form.expirationDate} onChange={e => setForm(f => ({ ...f, expirationDate: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Fornecedor</label>
                <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
                  <option value="">Selecione um fornecedor...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {suppliers.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Cadastre fornecedores na tela de Fornecedores.</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{modal === 'add' ? 'Cadastrar Produto' : 'Salvar Alterações'}</button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES MODAL */}
      {modal === 'categories' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>🗂 Gerenciar Categorias</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <label>Nova Categoria</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="Nome da categoria..." value={newCatName} onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCategory()} style={{ flex: 1 }} />
                  <button className="btn btn-primary btn-sm" onClick={addCategory}>Adicionar</button>
                </div>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {categories.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                    <span style={{ fontSize: 20 }}>{c.emoji}</span>
                    <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{c.label}</span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeCategory(c.id)}
                    >Remover</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => { onRefresh(); setModal(null); }}>Concluído</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h3>🗑️ Confirmar exclusão</h3>
              <button className="modal-close" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Tem certeza que deseja excluir este produto? As movimentações associadas também serão removidas.</p>
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
