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

function calcMargin(purchase: number, sale: number) {
  if (purchase <= 0) return 0;
  return ((sale - purchase) / purchase) * 100;
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

  function handlePrint() {
    const now = new Date().toLocaleString('pt-BR');
    const rows = filtered.map(p => {
      const cat = categories.find(c => c.id === p.category);
      const supplier = suppliers.find(s => s.id === p.supplierId);
      const status = getStockStatus(p);
      const mg = calcMargin(p.purchasePrice, p.salePrice);
      const statusColor = status.cls === 'badge-danger' ? '#c8102e' : status.cls === 'badge-warning' ? '#d97706' : '#16a34a';
      const mgColor = mg >= 0 ? '#16a34a' : '#c8102e';
      return `
        <tr>
          <td style="font-family:monospace;font-size:11px;color:#666">${p.sku}</td>
          <td style="font-weight:600">${p.name}</td>
          <td>${cat?.label || p.category}</td>
          <td>${supplier?.name || '—'}</td>
          <td style="text-align:center;font-weight:700">${p.quantity} ${p.unit}</td>
          <td>${fmtR(p.purchasePrice)}</td>
          <td style="color:${mgColor};font-weight:700;text-align:center">${mg >= 0 ? '+' : ''}${mg.toFixed(1)}%</td>
          <td style="font-weight:700;color:#003087">${fmtR(p.salePrice)}</td>
          <td>${p.expirationDate ? new Date(p.expirationDate).toLocaleDateString('pt-BR') : '—'}</td>
          <td style="color:${statusColor};font-weight:600">${status.label}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Estoque Atual — Supermercado Flosi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a2e; padding: 24px; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; border-bottom: 3px solid #003087; padding-bottom: 14px; }
    .header-text h1 { font-size: 18px; color: #003087; }
    .header-text p { font-size: 11px; color: #666; margin-top: 3px; }
    .summary { display: flex; gap: 20px; margin-bottom: 18px; flex-wrap: wrap; }
    .summary-box { background: #f0f4ff; border: 1px solid #c7d6f7; border-radius: 6px; padding: 10px 16px; min-width: 140px; }
    .summary-box .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: .5px; }
    .summary-box .value { font-size: 15px; font-weight: 800; color: #003087; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #003087; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; }
    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 18px; font-size: 10px; color: #999; text-align: right; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-text">
      <h1>🏪 Supermercado Flosi — Estoque Atual</h1>
      <p>Relatório gerado em ${now} &nbsp;|&nbsp; ${filtered.length} produto(s) listado(s) ${search || catFilter ? `&nbsp;|&nbsp; Filtro: "${search || catFilter}"` : ''}</p>
    </div>
  </div>
  <div class="summary">
    <div class="summary-box"><div class="label">Total de produtos</div><div class="value">${products.length}</div></div>
    <div class="summary-box"><div class="label">Valor de venda</div><div class="value">${fmtR(totalValue)}</div></div>
    <div class="summary-box"><div class="label">Custo de compra</div><div class="value">${fmtR(totalPurchaseValue)}</div></div>
    <div class="summary-box"><div class="label">Margem potencial</div><div class="value" style="color:#16a34a">${fmtR(margin)}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Código</th><th>Produto</th><th>Categoria</th><th>Fornecedor</th>
        <th>Qtd.</th><th>P. Compra</th><th>Margem</th><th>P. Venda</th><th>Validade</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Supermercado Flosi © ${new Date().getFullYear()} — Documento gerado pelo Sistema de Gerenciamento de Estoque</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ minWidth: 200 }}>
              <span className="search-icon">🔍</span>
              <input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} type="search" />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 170 }}>
              <option value="">Todas as categorias</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint} title="Exportar PDF">
              🖨️ Exportar PDF
            </button>
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
                  <th>Margem</th>
                  <th>P. Venda</th>
                  <th>Validade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const cat = categories.find(c => c.id === p.category);
                  const supplier = suppliers.find(s => s.id === p.supplierId);
                  const status = getStockStatus(p);
                  const pct = p.minQuantity > 0 ? Math.min(100, (p.quantity / (p.minQuantity * 3)) * 100) : 100;
                  const expiryInfo = getExpiryLabel(p.expirationDate);
                  const mg = calcMargin(p.purchasePrice, p.salePrice);
                  const isPos = mg >= 0;
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
                      <td>
                        <span style={{
                          display: 'inline-block', fontSize: 11, fontWeight: 800,
                          padding: '3px 8px', borderRadius: 99,
                          background: isPos ? '#dcfce7' : '#fee2e2',
                          color: isPos ? '#16a34a' : '#c8102e'
                        }}>
                          {isPos ? '+' : ''}{mg.toFixed(1)}%
                        </span>
                        <div style={{ fontSize: 10, color: isPos ? '#16a34a' : '#c8102e', marginTop: 2 }}>
                          {isPos ? '+' : ''}{fmtR(p.salePrice - p.purchasePrice)}/un
                        </div>
                      </td>
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
