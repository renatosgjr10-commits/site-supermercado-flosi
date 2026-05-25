import { Product, Movement, getCategories } from '../types';
import { getSuppliers } from '../store';

interface Props {
  products: Product[];
  movements: Movement[];
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard({ products, movements }: Props) {
  const categories = getCategories();
  const suppliers = getSuppliers();
  const totalItems = products.reduce((s, p) => s + p.quantity, 0);
  const totalValue = products.reduce((s, p) => s + p.quantity * p.salePrice, 0);
  const lowStock = products.filter(p => p.quantity <= p.minQuantity);
  const outOfStock = products.filter(p => p.quantity === 0);

  const today = new Date().toISOString().slice(0, 10);
  const expiringSoon = products.filter(p => {
    if (!p.expirationDate) return false;
    const diff = (new Date(p.expirationDate).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 7;
  });

  const recent = movements.slice(0, 8);

  // Top selling (by saida movements)
  const salesMap: Record<string, number> = {};
  movements.filter(m => m.type === 'saida').forEach(m => {
    salesMap[m.productName] = (salesMap[m.productName] || 0) + m.quantity;
  });
  const topSelling = Object.entries(salesMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSales = topSelling[0]?.[1] || 1;

  // By category
  const byCategory = categories.map(cat => {
    const prods = products.filter(p => p.category === cat.id);
    return { ...cat, count: prods.length, qty: prods.reduce((s, p) => s + p.quantity, 0) };
  }).filter(c => c.count > 0).slice(0, 6);

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card accent-navy">
          <div className="stat-icon blue">📦</div>
          <div className="stat-info">
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Produtos Cadastrados</div>
            <div className="stat-sub">{totalItems.toLocaleString('pt-BR')} unidades em estoque</div>
          </div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-icon green">💰</div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 18 }}>{fmt(totalValue)}</div>
            <div className="stat-label">Valor em Estoque</div>
            <div className="stat-sub">Baseado no preço de venda</div>
          </div>
        </div>
        <div className="stat-card accent-yellow">
          <div className="stat-icon yellow">⚠️</div>
          <div className="stat-info">
            <div className="stat-value">{lowStock.length}</div>
            <div className="stat-label">Estoque Baixo</div>
            <div className="stat-sub">{outOfStock.length} produto(s) zerado(s)</div>
          </div>
        </div>
        <div className="stat-card accent-red">
          <div className="stat-icon red">🔄</div>
          <div className="stat-info">
            <div className="stat-value">{movements.length}</div>
            <div className="stat-label">Movimentações</div>
            <div className="stat-sub">{suppliers.length} fornecedor(es) ativo(s)</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="alert-banner">
          ⚠️ <strong>{lowStock.length} produto(s)</strong> com estoque abaixo do mínimo:&nbsp;
          {lowStock.slice(0, 3).map(p => p.name).join(', ')}
          {lowStock.length > 3 ? ` e mais ${lowStock.length - 3}...` : ''}
        </div>
      )}

      {expiringSoon.length > 0 && (
        <div className="alert-banner" style={{ background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e', marginTop: -8 }}>
          📅 <strong>{expiringSoon.length} produto(s)</strong> com validade próxima (7 dias):&nbsp;
          {expiringSoon.slice(0, 3).map(p => p.name).join(', ')}
        </div>
      )}

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 16, marginBottom: 16 }}>
        {/* Recent movements */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-stripe">
              <div className="card-stripe" />
              <div>
                <div className="card-title">Movimentações Recentes</div>
                <div className="card-subtitle">Últimas entradas e saídas</div>
              </div>
            </div>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state"><div className="emoji">📋</div><p>Nenhuma movimentação registrada</p></div>
          ) : (
            recent.map(m => (
              <div className="move-card" key={m.id}>
                <div className={`move-dot ${m.type}`} />
                <div className="move-info">
                  <div className="move-product">{m.productName}</div>
                  <div className="move-meta">{m.reason}{m.observation ? ` · ${m.observation}` : ''} · {fmtDate(m.date)}</div>
                </div>
                <div className={`move-qty ${m.type}`}>
                  {m.type === 'entrada' ? '+' : '-'}{m.quantity}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Category breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-stripe">
              <div className="card-stripe" />
              <div>
                <div className="card-title">Por Categoria</div>
                <div className="card-subtitle">Distribuição de produtos</div>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ padding: '14px 20px' }}>
            {byCategory.length === 0 ? (
              <div className="empty-state"><div className="emoji">📊</div><p>Sem dados</p></div>
            ) : byCategory.map((c, i) => {
              const colors = ['#003087', '#c8102e', '#16a34a', '#d97706', '#7c3aed', '#0891b2'];
              return (
                <div key={c.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {c.emoji} {c.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.count} prod · {c.qty} un</span>
                  </div>
                  <div className="stock-bar" style={{ height: 8 }}>
                    <div className="stock-bar-fill" style={{ width: `${Math.min(100, (c.qty / Math.max(totalItems, 1)) * 100)}%`, background: colors[i % colors.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
        {/* Top selling */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-stripe">
              <div className="card-stripe" />
              <div>
                <div className="card-title">🏆 Produtos Mais Vendidos</div>
                <div className="card-subtitle">Por volume de saídas registradas</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {topSelling.length === 0 ? (
              <div className="empty-state"><div className="emoji">📊</div><p>Nenhuma venda registrada</p></div>
            ) : (
              <div className="chart-bar-container">
                {topSelling.map(([name, qty], i) => (
                  <div className="chart-bar-row" key={name}>
                    <span className="chart-bar-label" title={name}>
                      <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>#{i + 1}</span>{name}
                    </span>
                    <div className="chart-bar-track">
                      <div className="chart-bar-fill" style={{ width: `${(qty / maxSales) * 100}%`, background: i === 0 ? 'var(--red)' : 'var(--navy)' }} />
                    </div>
                    <span className="chart-bar-value">{qty}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low stock alert table */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-stripe">
              <div className="card-stripe" />
              <div>
                <div className="card-title" style={{ color: 'var(--red)' }}>🚨 Estoque Crítico</div>
                <div className="card-subtitle">Produtos que precisam de reposição</div>
              </div>
            </div>
          </div>
          {lowStock.length === 0 ? (
            <div className="empty-state"><div className="emoji">✅</div><p>Todos os produtos estão em nível normal</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Produto</th><th>Atual</th><th>Mín.</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {lowStock.slice(0, 6).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                      <td style={{ fontWeight: 700, color: p.quantity === 0 ? 'var(--red)' : 'var(--warning)' }}>{p.quantity}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.minQuantity}</td>
                      <td>{p.quantity === 0 ? <span className="badge badge-danger">Zerado</span> : <span className="badge badge-warning">Baixo</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
