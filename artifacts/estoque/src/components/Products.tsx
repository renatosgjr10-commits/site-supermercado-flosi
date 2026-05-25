import { useState } from 'react';
import { Product, Category, CATEGORIES, UNITS } from '../types';
import { addProduct, updateProduct, deleteProduct } from '../store';
import { showToast } from './Toast';

interface Props {
  products: Product[];
  onRefresh: () => void;
}

const EMPTY_FORM = { name: '', sku: '', category: 'outros' as Category, quantity: 0, minQuantity: 5, price: 0, unit: 'un' };

function getStockStatus(p: Product) {
  if (p.quantity === 0) return { label: 'Sem estoque', cls: 'badge-danger' };
  if (p.quantity <= p.minQuantity) return { label: 'Estoque baixo', cls: 'badge-warning' };
  return { label: 'Normal', cls: 'badge-success' };
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getBarColor(p: Product) {
  if (p.quantity === 0) return '#ef4444';
  if (p.quantity <= p.minQuantity) return '#f59e0b';
  return '#22c55e';
}

export default function Products({ products, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCat = catFilter ? p.category === catFilter : true;
    return matchSearch && matchCat;
  });

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModal('add');
  }

  function openEdit(p: Product) {
    setForm({ name: p.name, sku: p.sku, category: p.category, quantity: p.quantity, minQuantity: p.minQuantity, price: p.price, unit: p.unit });
    setEditId(p.id);
    setModal('edit');
  }

  function handleSubmit() {
    if (!form.name.trim()) { showToast('Informe o nome do produto', 'error'); return; }
    if (!form.sku.trim()) { showToast('Informe o SKU/código', 'error'); return; }
    if (editId) {
      updateProduct(editId, form);
      showToast('Produto atualizado!');
    } else {
      addProduct(form);
      showToast('Produto cadastrado!');
    }
    setModal(null);
    onRefresh();
  }

  function handleDelete() {
    if (deleteId) {
      deleteProduct(deleteId);
      showToast('Produto removido', 'warning');
      setDeleteId(null);
      onRefresh();
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Produtos</div>
            <div className="card-subtitle">{products.length} produto(s) cadastrado(s)</div>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Novo Produto</button>
        </div>

        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)' }}>
          <div className="toolbar">
            <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
              <span className="search-icon">🔍</span>
              <input placeholder="Buscar por nome ou SKU..." value={search} onChange={e => setSearch(e.target.value)} type="search" />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 160 }}>
              <option value="">Todas categorias</option>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
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
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Estoque</th>
                  <th>Preço</th>
                  <th>Situação</th>
                  <th style={{ width: 100 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const status = getStockStatus(p);
                  const pct = p.minQuantity > 0 ? Math.min(100, (p.quantity / (p.minQuantity * 3)) * 100) : 100;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.sku}</div>
                      </td>
                      <td>
                        <span className="category-chip">{CATEGORIES[p.category].emoji} {CATEGORIES[p.category].label}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.quantity} {p.unit}</div>
                        <div className="stock-bar" style={{ width: 80 }}>
                          <div className="stock-bar-fill" style={{ width: `${pct}%`, background: getBarColor(p) }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>mín: {p.minQuantity}</div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{fmt(p.price)}</td>
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
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
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
                  <label>SKU / Código *</label>
                  <input placeholder="Ex: ALI-001" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Categoria</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}>
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                  </select>
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
                  <label>Preço (R$)</label>
                  <input type="number" min={0} step={0.01} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label>Unidade</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{modal === 'add' ? 'Cadastrar' : 'Salvar'}</button>
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
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Tem certeza que deseja excluir este produto? As movimentações relacionadas também serão removidas.
              </p>
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
