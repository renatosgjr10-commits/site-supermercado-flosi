import { Product, Movement, CATEGORIES } from '../types';

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
  const totalItems = products.reduce((s, p) => s + p.quantity, 0);
  const totalValue = products.reduce((s, p) => s + p.quantity * p.price, 0);
  const lowStock = products.filter(p => p.quantity <= p.minQuantity);
  const outOfStock = products.filter(p => p.quantity === 0);

  const recent = movements.slice(0, 8);

  const byCategory = Object.entries(CATEGORIES).map(([cat, info]) => {
    const count = products.filter(p => p.category === cat).length;
    const qty = products.filter(p => p.category === cat).reduce((s, p) => s + p.quantity, 0);
    return { cat, ...info, count, qty };
  }).filter(c => c.count > 0);

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📦</div>
          <div className="stat-info">
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Produtos Cadastrados</div>
            <div className="stat-sub">{totalItems} unidades no total</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💰</div>
          <div className="stat-info">
            <div className="stat-value">{fmt(totalValue)}</div>
            <div className="stat-label">Valor em Estoque</div>
            <div className="stat-sub">Custo total dos itens</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⚠️</div>
          <div className="stat-info">
            <div className="stat-value">{lowStock.length}</div>
            <div className="stat-label">Estoque Baixo</div>
            <div className="stat-sub">{outOfStock.length} produto(s) sem estoque</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">🔄</div>
          <div className="stat-info">
            <div className="stat-value">{movements.length}</div>
            <div className="stat-label">Movimentações</div>
            <div className="stat-sub">Total registrado</div>
          </div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="alert-banner">
          ⚠️ {lowStock.length} produto(s) com estoque abaixo do mínimo:&nbsp;
          {lowStock.slice(0, 3).map(p => p.name).join(', ')}
          {lowStock.length > 3 ? ` e mais ${lowStock.length - 3}...` : ''}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Movimentações Recentes</div>
              <div className="card-subtitle">Últimas entradas e saídas</div>
            </div>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">📋</div>
              <p>Nenhuma movimentação registrada</p>
            </div>
          ) : (
            recent.map(m => (
              <div className="move-card" key={m.id}>
                <div className={`move-dot ${m.type}`} />
                <div className="move-info">
                  <div className="move-product">{m.productName}</div>
                  <div className="move-meta">{m.reason} · {fmtDate(m.date)}</div>
                </div>
                <div className={`move-qty ${m.type}`}>
                  {m.type === 'entrada' ? '+' : '-'}{m.quantity}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Por Categoria</div>
              <div className="card-subtitle">Produtos por grupo</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: '12px 20px' }}>
            {byCategory.length === 0 ? (
              <div className="empty-state"><div className="emoji">📊</div><p>Sem dados</p></div>
            ) : byCategory.map(c => (
              <div key={c.cat} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>{c.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.count} prod · {c.qty} un</span>
                  </div>
                  <div className="stock-bar">
                    <div className="stock-bar-fill" style={{ width: `${Math.min(100, (c.qty / totalItems) * 100)}%`, background: 'var(--primary)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div>
              <div className="card-title" style={{ color: 'var(--danger)' }}>🚨 Produtos com Estoque Crítico</div>
              <div className="card-subtitle">Reposição necessária</div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Estoque Atual</th>
                  <th>Mínimo</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong><br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.sku}</span></td>
                    <td><span style={{ fontWeight: 700, color: p.quantity === 0 ? 'var(--danger)' : 'var(--warning)' }}>{p.quantity} {p.unit}</span></td>
                    <td>{p.minQuantity} {p.unit}</td>
                    <td>{p.quantity === 0 ? <span className="badge badge-danger">Sem estoque</span> : <span className="badge badge-warning">Estoque baixo</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
