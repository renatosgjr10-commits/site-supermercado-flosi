import { useState } from 'react';
import { Product, Movement } from '../types';
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
  const [form, setForm] = useState({ productId: '', type: 'entrada' as 'entrada' | 'saida', quantity: 1, reason: '' });

  const filtered = movements.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = m.productName.toLowerCase().includes(q) || m.reason.toLowerCase().includes(q);
    const matchType = typeFilter ? m.type === typeFilter : true;
    return matchSearch && matchType;
  });

  function handleSubmit() {
    if (!form.productId) { showToast('Selecione um produto', 'error'); return; }
    if (form.quantity <= 0) { showToast('Quantidade deve ser maior que zero', 'error'); return; }
    if (!form.reason.trim()) { showToast('Informe o motivo', 'error'); return; }

    const result = addMovement(form.productId, form.type, form.quantity, form.reason);
    if (!result) {
      showToast('Saldo insuficiente para saída!', 'error');
      return;
    }

    showToast(form.type === 'entrada' ? '✓ Entrada registrada!' : '✓ Saída registrada!');
    setModal(false);
    setForm({ productId: '', type: 'entrada', quantity: 1, reason: '' });
    onRefresh();
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Movimentações de Estoque</div>
            <div className="card-subtitle">{movements.length} movimentação(ões) registrada(s)</div>
          </div>
          <button className="btn btn-primary" onClick={() => setModal(true)}>+ Registrar Movimentação</button>
        </div>

        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)' }}>
          <div className="toolbar">
            <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
              <span className="search-icon">🔍</span>
              <input placeholder="Buscar produto ou motivo..." value={search} onChange={e => setSearch(e.target.value)} type="search" />
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
                      <span style={{ fontWeight: 700, color: m.type === 'entrada' ? 'var(--success)' : 'var(--danger)', fontSize: 15 }}>
                        {m.type === 'entrada' ? '+' : '-'}{m.quantity}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{m.reason}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(m.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
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
                      style={{
                        flex: 1, padding: '12px', border: `2px solid ${form.type === t ? (t === 'entrada' ? 'var(--success)' : 'var(--danger)') : 'var(--card-border)'}`,
                        borderRadius: 'var(--radius-sm)', background: form.type === t ? (t === 'entrada' ? 'var(--success-light)' : 'var(--danger-light)') : 'var(--card-bg)',
                        cursor: 'pointer', fontWeight: 700, fontSize: 14,
                        color: form.type === t ? (t === 'entrada' ? 'var(--success)' : 'var(--danger)') : 'var(--text-secondary)',
                        transition: 'all 0.15s'
                      }}
                    >
                      {t === 'entrada' ? '⬆ Entrada' : '⬇ Saída'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Produto *</label>
                <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}>
                  <option value="">Selecione um produto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — estoque atual: {p.quantity} {p.unit}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantidade *</label>
                <input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label>Motivo *</label>
                <input placeholder="Ex: Compra fornecedor, Venda, Ajuste de inventário..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button
                className="btn"
                style={{ background: form.type === 'entrada' ? 'var(--success)' : 'var(--danger)', color: 'white' }}
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
