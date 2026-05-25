import { useState } from 'react';
import { CREDENTIALS } from '../types';

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (user === CREDENTIALS.user && pass === CREDENTIALS.password) {
      onLogin();
    } else {
      setError('Usuário ou senha incorretos. Tente novamente.');
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo-flosi.png" alt="Supermercado Flosi" />
          <p>Sistema de Gerenciamento</p>
        </div>

        <div className="login-divider" />

        <div className="login-title">Gerenciamento de Estoque<br />do Supermercado Flosi</div>

        {error && <div className="login-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuário</label>
            <input
              type="text"
              placeholder="Digite seu usuário"
              value={user}
              onChange={e => { setUser(e.target.value); setError(''); }}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={pass}
              onChange={e => { setPass(e.target.value); setError(''); }}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, marginTop: 8, justifyContent: 'center', borderRadius: 10 }}>
            🔐 Entrar no Sistema
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            Esqueceu sua senha?
          </button>
        </div>

        <div className="login-hint">
          Acesso restrito · Supermercado Flosi © {new Date().getFullYear()}
        </div>
      </div>

      {showForgot && (
        <div className="modal-overlay" onClick={() => setShowForgot(false)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔑 Recuperação de Acesso</h3>
              <button className="modal-close" onClick={() => setShowForgot(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Este é um sistema interno do Supermercado Flosi. Entre em contato com o administrador do sistema para redefinir sua senha.
              </p>
              <div style={{ background: '#f0f4ff', border: '1px solid #c7d6f7', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>📋 CREDENCIAIS PADRÃO DO SISTEMA</div>
                <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span><strong>Usuário:</strong> <code style={{ background: '#dde8ff', padding: '1px 6px', borderRadius: 4 }}>admin</code></span>
                  <span><strong>Senha:</strong> <code style={{ background: '#dde8ff', padding: '1px 6px', borderRadius: 4 }}>flosi123</code></span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
                ℹ️ Caso as credenciais tenham sido alteradas, contate o TI do supermercado.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowForgot(false)}>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
