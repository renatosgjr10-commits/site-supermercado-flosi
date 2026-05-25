import { useState } from 'react';
import { Product, getCategories } from '../types';
import { getSuppliers } from '../store';

interface Props {
  products: Product[];
}

function fmtR(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function getStockStatus(p: Product) {
  if (p.quantity === 0) return { label: 'Sem estoque', cls: 'badge-danger' };
  if (p.quantity <= p.minQuantity) return { label: 'Estoque baixo', cls: 'badge-warning' };
  return { label: 'Normal', cls: 'badge-success' };
}

function getBarColor(p: Product) {
  if (p.quantity === 0) return '#c8102e';
  if (p.quantity <= p.minQuantity) return '#d97706';
  return '#16a34a';
}

function getExpiryLabel(date: string) {
  if (!date) return null;
  const diff = (new Date(date).getTime() - Date.now()) / 86400000;
  if (diff < 0) return { label: 'Vencido', cls: 'expiry-expired' };
  if (diff <= 7) return { label: `${Math.floor(diff)}d`, cls: 'expiry-soon' };
  return null;
}

export default function CurrentStock({ products }: Props) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const categories = getCategories();
  const suppliers = getSuppliers();

  const totalValue = products.reduce((s, p) => s + p.quantity * p.salePrice, 0);
  const totalPurchaseValue = products.reduce((s, p) => s + p.quantity * p.purchasePrice, 0);
  const margin = totalValue - totalPurchaseValue;

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) ||
      (suppliers.find(s => s.id === p.supplierId)?.name.toLowerCase().includes(q) ?? false);
    const matchCat = catFilter ? p.category === catFilter : true;
    return matchSearch && matchCat;
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 18 }}>
        <div className="stat-card accent-navy">
          <div className="stat-icon blue">📦</div>
          <div className="stat-info">
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Total de Produtos</div>
            <div className="stat-sub">{products.reduce((s, p) => s + p.quantity, 0)} unidades</div>
          </div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-icon green">💰</div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 17 }}>{fmtR(totalValue)}</div>
            <div className="stat-label">Valor de Venda</div>
            <div className="stat-sub">Preço de venda total</div>
          </div>
        </div>
        <div className="stat-card accent-navy">
          <div className="stat-icon blue">🏷️</div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 17 }}>{fmtR(totalPurchaseValue)}</div>
            <div className="stat-label">Custo de Compra</div>
            <div className="stat-sub">Investimento em estoque</div>
          </div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-icon green">📈</div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 17 }}>{fmtR(margin)}</div>
            <div className="stat-label">Margem Potencial</div>
            <div className="stat-sub">Lucro bruto estimado</div>
          </div>
        </div>
      </div>

      {/* By category breakdown */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-header-stripe">
            <div className="card-stripe" />
            <div>
              <div className="card-title">Resumo por Categoria</div>
              <div className="card-subtitle">Distribuição visual do estoque</div>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {categories.map((cat, i) => {
              const prods = products.filter(p => p.category === cat.id);
              if (prods.length === 0) return null;
              const qty = prods.reduce((s, p) => s + p.quantity, 0);
              const val = prods.reduce((s, p) => s + p.quantity * p.salePrice, 0);
              const colors = ['#003087', '#c8102e', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#059669', '#ea580c'];
              const color = colors[i % colors.length];
              return (
                <div key={cat.id} style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', border: `1px solid var(--card-border)` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{cat.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{cat.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{prods.length} produto(s)</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, color }}>{qty} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>un</span></div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{fmtR(val)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full product list */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-stripe">
            <div className="card-stripe" />
            <div>
              <div className="card-title">Estoque Atual — Lista Completa</div>
              <div className="card-subtitle">{filtered.length} de {products.length} produto(s)</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="search-bar" style={{ minWidth: 200 }}>
              <span className="search-icon">🔍</span>
              <input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} type="search" />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 170 }}>
              <option value="">Todas as categorias</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          {products.length === 0 ? (
            <div className="empty-state"><div className="emoji">📦</div><p>Nenhum produto cadastrado</p></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="emoji">🔍</div><p>Nenhum produto encontrado para "{search || catFilter}"</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Fornecedor</th>
                  <th>Qtd. Atual</th>
                  <th>Qtd. Mín.</th>
                  <th>P. Compra</th>
                  <th>P. Venda</th>
                  <th>Validade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .map(p => {
                    const cat = categories.find(c => c.id === p.category);
                    const supplier = suppliers.find(s => s.id === p.supplierId);
                    const status = getStockStatus(p);
                    const pct = p.minQuantity > 0 ? Math.min(100, (p.quantity / (p.minQuantity * 3)) * 100) : 100;
                    const expiryInfo = getExpiryLabel(p.expirationDate);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{p.sku}</td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>
                          <span className="category-chip">{cat?.emoji || '📦'} {cat?.label || p.category}</span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{supplier?.name || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 700, color: p.quantity === 0 ? 'var(--red)' : 'inherit' }}>{p.quantity} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{p.unit}</span></span>
                            <div className="stock-bar" style={{ width: 70 }}>
                              <div className="stock-bar-fill" style={{ width: `${pct}%`, background: getBarColor(p) }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{p.minQuantity} {p.unit}</td>
                        <td style={{ fontSize: 13 }}>{fmtR(p.purchasePrice)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{fmtR(p.salePrice)}</td>
                        <td>
                          {p.expirationDate
                            ? <span>
                                <span style={{ fontSize: 12 }}>{new Date(p.expirationDate).toLocaleDateString('pt-BR')}</span>
                                {expiryInfo && <span className={expiryInfo.cls} style={{ fontSize: 10, marginLeft: 4 }}>({expiryInfo.label})</span>}
                              </span>
                            : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                        </td>
                        <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
