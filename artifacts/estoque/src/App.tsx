import { useState, useEffect, useCallback } from 'react';
import { Product, Movement } from './types';
import { getProducts, getMovements, seedDemoData } from './store';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Movements from './components/Movements';
import { ToastContainer } from './components/Toast';

type Page = 'dashboard' | 'products' | 'movements';

const NAV = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: '📊' },
  { id: 'products' as Page, label: 'Produtos', icon: '📦' },
  { id: 'movements' as Page, label: 'Movimentações', icon: '🔄' },
];

const PAGE_TITLES: Record<Page, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Visão geral do estoque' },
  products: { title: 'Produtos', sub: 'Gerencie seu catálogo de produtos' },
  movements: { title: 'Movimentações', sub: 'Registro de entradas e saídas' },
};

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refresh = useCallback(() => {
    setProducts(getProducts());
    setMovements(getMovements());
  }, []);

  useEffect(() => {
    seedDemoData();
    refresh();
  }, [refresh]);

  const lowStockCount = products.filter(p => p.quantity <= p.minQuantity).length;
  const { title, sub } = PAGE_TITLES[page];

  return (
    <div className="layout">
      {/* Mobile menu button */}
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(o => !o)}>☰</button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🏪</div>
          <h1>EstoqueSimples</h1>
          <p>Controle de Estoque</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          {NAV.map(item => (
            <button
              key={item.id}
              className={`nav-item${page === item.id ? ' active' : ''}`}
              onClick={() => { setPage(item.id); setSidebarOpen(false); }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.id === 'products' && lowStockCount > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#ef4444', color: 'white',
                  borderRadius: '10px', fontSize: '10px', fontWeight: 700,
                  padding: '1px 7px', minWidth: 18, textAlign: 'center'
                }}>{lowStockCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: 2 }}>{products.length} produtos</div>
          <div>{products.reduce((s, p) => s + p.quantity, 0)} unidades em estoque</div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h2>{title}</h2>
            <p>{sub}</p>
          </div>
          <div className="topbar-right">
            {lowStockCount > 0 && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 8, padding: '6px 12px', fontSize: 12,
                  color: '#b91c1c', fontWeight: 600, cursor: 'pointer'
                }}
                onClick={() => setPage('products')}
              >
                ⚠️ {lowStockCount} alerta{lowStockCount > 1 ? 's' : ''}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Sistema online
            </div>
          </div>
        </header>

        <main className="page-content">
          {page === 'dashboard' && <Dashboard products={products} movements={movements} />}
          {page === 'products' && <Products products={products} onRefresh={refresh} />}
          {page === 'movements' && <Movements products={products} movements={movements} onRefresh={refresh} />}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
