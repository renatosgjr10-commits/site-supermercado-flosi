import { useState } from 'react';
import { Product, Movement, getCategories } from '../types';
import { addMovement } from '../store';
import { showToast } from './Toast';

interface Props {
  products: Product[];
  movements: Movement[];
  onRefresh: () => void;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Movements({ products, movements, onRefresh }: Props) {
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState({ productId: '', type: 'entrada' as 'entrada' | 'saida', quantity: 1, reason: '', observation: '' });
  const categories = getCategories();

  const filtered = movements.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = m.productName.toLowerCase().includes(q) || m.reason.toLowerCase().includes(q);
    const matchType = typeFilter ? m.type === typeFilter : true;
    return matchSearch && matchType;
  });

  function handleSubmit() {
    if (!form.productId) { showToast('Selecione um produto', 'error'); return; }
    if (form.quantity <= 0) { showToast('Quantidade deve ser maior que zero', 'error'); return; }
    if (!form.reason.trim()) { showToast('Informe o motivo da movimentação', 'error'); return; }
    const result = addMovement(form.productId, form.type, form.quantity, form.reason, form.observation);
    if (!result) { showToast('Saldo insuficiente para saída!', 'error'); return; }
    showToast(form.type === 'entrada' ? '⬆ Entrada registrada com sucesso!' : '⬇ Saída registrada com sucesso!');
    setModal(false);
    setForm({ productId: '', type: 'entrada', quantity: 1, reason: '', observation: '' });
    onRefresh();
  }

  const selectedProduct = products.find(p => p.id === form.productId);

  const totalEntradas = movements.filter(m => m.type === 'entrada').reduce((s, m) => s + m.quantity, 0);
  const totalSaidas = movements.filter(m => m.type === 'saida').reduce((s, m) => s + m.quantity, 0);

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 18 }}>
        <div className="stat-card accent-green">
          <div className="stat-icon green">⬆️</div>
          <div className="stat-info">
            <div className="stat-value">{totalEntradas}</div>
            <div className="stat-label">Total de Entradas</div>
            <div className="stat-sub">Unidades recebidas</div>
          </div>
        </div>
        <div className="stat-card accent-red">
          <div className="stat-icon red">⬇️</div>
          <div className="stat-info">
            <div className="stat-value">{totalSaidas}</div>
            <div className="stat-label">Total de Saídas</div>
            <div className="stat-sub">Unidades expedidas</div>
          </div>
        </div>
        <div className="stat-card accent-navy">
          <div className="stat-icon blue">🔄</div>
          <div className="stat-info">
            <div className="stat-value">{movements.length}</div>
            <div className="stat-label">Total Movimentações</div>
            <div className="stat-sub">Registros no histórico</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-stripe">
            <div className="card-stripe" />
            <div>
              <div className="card-title">Controle de Entrada e Saída</div>
              <div className="card-subtitle">Histórico completo de movimentações</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setModal(true)}>+ Registrar Movimentação</button>
        </div>

        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)' }}>
          <div className="toolbar">
            <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
              <span className="search-icon">🔍</span>
              <input placeholder="Buscar Produtos..." value={search} onChange={e => setSearch(e.target.value)} type="search" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 160 }}>
              <option value="">Todos os tipos</option>
              <option value="entrada">⬆️ Entradas</option>
              <option value="saida">⬇️ Saídas</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">🔄</div>
              <p>{search || typeFilter ? 'Nenhuma movimentação encontrada' : 'Nenhuma movimentação registrada'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Motivo</th>
                  <th>Observações</th>
                  <th>Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}>
                    <td>
                      {m.type === 'entrada'
                        ? <span className="badge badge-success">⬆ Entrada</span>
                        : <span className="badge badge-danger">⬇ Saída</span>}
                    </td>
                    <td style={{ fontWeight: 600 }}>{m.productName}</td>
                    <td>
                      <span style={{ fontWeight: 800, color: m.type === 'entrada' ? 'var(--success)' : 'var(--red)', fontSize: 15 }}>
                        {m.type === 'entrada' ? '+' : '-'}{m.quantity}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{m.reason}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{m.observation || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(m.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>🔄 Registrar Movimentação</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tipo de Movimentação *</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['entrada', 'saida'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className="type-toggle-btn"
                      style={{
                        border: `2px solid ${form.type === t ? (t === 'entrada' ? 'var(--success)' : 'var(--red)') : 'var(--card-border)'}`,
                        background: form.type === t ? (t === 'entrada' ? 'var(--success-light)' : 'var(--red-light)') : 'var(--card-bg)',
                        color: form.type === t ? (t === 'entrada' ? 'var(--success)' : 'var(--red)') : 'var(--text-secondary)',
                      }}
                    >
                      {t === 'entrada' ? '⬆ Entrada de Mercadoria' : '⬇ Saída de Mercadoria'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Produto *</label>
                <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}>
                  <option value="">Selecione um produto...</option>
                  {(() => {
                    const grouped: Record<string, Product[]> = {};
                    products.forEach(p => { (grouped[p.category] = grouped[p.category] || []).push(p); });
                    return Object.entries(grouped).map(([cat, prods]) => {
                      const catInfo = categories.find(c => c.id === cat);
                      return (
                        <optgroup key={cat} label={`${catInfo?.emoji || '📦'} ${catInfo?.label || cat}`}>
                          {prods.map(p => (
                            <option key={p.id} value={p.id}>{p.name} — estoque: {p.quantity} {p.unit}</option>
                          ))}
                        </optgroup>
                      );
                    });
                  })()}
                </select>
                {selectedProduct && form.type === 'saida' && (
                  <div style={{ fontSize: 12, color: 'var(--navy)', marginTop: 5, fontWeight: 600 }}>
                    💡 Estoque disponível: {selectedProduct.quantity} {selectedProduct.unit}
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantidade *</label>
                  <input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label>Motivo *</label>
                  <input placeholder="Ex: Compra, Venda, Ajuste..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Observações (opcional)</label>
                <textarea placeholder="NF número, lote, informações adicionais..." value={form.observation}
                  onChange={e => setForm(f => ({ ...f, observation: e.target.value }))}
                  style={{ minHeight: 64 }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button
                className="btn"
                style={{ background: form.type === 'entrada' ? 'var(--success)' : 'var(--red)', color: 'white' }}
                onClick={handleSubmit}
              >
                {form.type === 'entrada' ? '⬆ Confirmar Entrada' : '⬇ Confirmar Saída'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
