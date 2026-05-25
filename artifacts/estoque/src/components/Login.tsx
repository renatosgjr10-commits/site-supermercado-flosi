import { useState } from 'react';
import { CREDENTIALS } from '../types';

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

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

        <div className="login-hint">
          Acesso restrito · Supermercado Flosi © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
