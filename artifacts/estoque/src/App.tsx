import { useState, useEffect, useCallback } from 'react';
import { Product, Movement, Supplier } from './types';
import { getProducts, getMovements, getSuppliers, seedDemoData } from './store';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Movements from './components/Movements';
import CurrentStock from './components/CurrentStock';
import Suppliers from './components/Suppliers';
import { ToastContainer } from './components/Toast';

type Page = 'dashboard' | 'products' | 'movements' | 'stock' | 'suppliers';

const NAV: { id: Page; label: string; icon: string; section?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', section: 'VISÃO GERAL' },
  { id: 'stock', label: 'Estoque Atual', icon: '🏪', section: 'ESTOQUE' },
  { id: 'products', label: 'Cadastro de Produtos', icon: '📦' },
  { id: 'movements', label: 'Entrada e Saída', icon: '🔄' },
  { id: 'suppliers', label: 'Fornecedores', icon: '🏭', section: 'CADASTROS' },
];

const PAGE_INFO: Record<Page, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Visão geral do estoque' },
  stock: { title: 'Estoque Atual', sub: 'Lista completa de produtos disponíveis' },
  products: { title: 'Cadastro de Produtos', sub: 'Gerencie o catálogo de produtos' },
  movements: { title: 'Entrada e Saída', sub: 'Controle de movimentação do estoque' },
  suppliers: { title: 'Fornecedores', sub: 'Empresas parceiras e fornecedores' },
};

const AUTH_KEY = 'flosi_auth';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [page, setPage] = useState<Page>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refresh = useCallback(() => {
    setProducts(getProducts());
    setMovements(getMovements());
    setSuppliers(getSuppliers());
  }, []);

  useEffect(() => {
    if (loggedIn) {
      seedDemoData();
      refresh();
    }
  }, [loggedIn, refresh]);

  function handleLogin() {
    sessionStorage.setItem(AUTH_KEY, 'true');
    setLoggedIn(true);
  }

  function handleLogout() {
    sessionStorage.removeItem(AUTH_KEY);
    setLoggedIn(false);
  }

  if (!loggedIn) return <Login onLogin={handleLogin} />;

  const lowStockCount = products.filter(p => p.quantity <= p.minQuantity).length;
  const { title, sub } = PAGE_INFO[page];

  let currentSection = '';

  return (
    <div className="layout">
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(o => !o)}>☰</button>

      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo-flosi.png" alt="Flosi Supermercado" />
          <div className="sidebar-logo-text">
            <h1>Gerenciamento de Estoque</h1>
            <p>Supermercado Flosi</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(item => {
            const showSection = item.section && item.section !== currentSection;
            if (item.section) currentSection = item.section;
            return (
              <div key={item.id}>
                {showSection && <div className="nav-section-label">{item.section}</div>}
                <button
                  className={`nav-item${page === item.id ? ' active' : ''}`}
                  onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                  {item.id === 'products' && lowStockCount > 0 && (
                    <span className="nav-badge">{lowStockCount}</span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-info">
            <strong>{products.length}</strong> produtos · <strong>{suppliers.length}</strong> fornecedores
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            🚪 Sair do Sistema
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <span className="bc-root">🏪 Flosi</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">{title}</span>
          </div>
          <div style={{ flex: 1, paddingLeft: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</span>
          </div>
          <div className="topbar-right">
            {lowStockCount > 0 && (
              <div className="topbar-alert" onClick={() => setPage('products')}>
                ⚠️ {lowStockCount} alerta{lowStockCount > 1 ? 's' : ''} de estoque
              </div>
            )}
            <div className="topbar-status">
              <span className="status-dot" />
              Sistema online
            </div>
          </div>
        </header>

        <main className="page-content">
          <div className="page-header">
            <div className="page-header-left">
              <h2>{title}</h2>
              <p>{sub}</p>
            </div>
          </div>

          {page === 'dashboard' && <Dashboard products={products} movements={movements} />}
          {page === 'products' && <Products products={products} onRefresh={refresh} />}
          {page === 'movements' && <Movements products={products} movements={movements} onRefresh={refresh} />}
          {page === 'stock' && <CurrentStock products={products} />}
          {page === 'suppliers' && <Suppliers suppliers={suppliers} onRefresh={refresh} />}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
