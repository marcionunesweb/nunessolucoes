import { useState, type FormEvent } from 'react';
import { ApiError, login, setup } from './api';

interface LoginProps {
  needsSetup: boolean;
  onAuthenticated: (email: string) => void;
}

function mensagemErro(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'invalid_credentials':
        return 'E-mail ou senha incorretos.';
      case 'weak_password':
        return 'A senha precisa ter pelo menos 8 caracteres.';
      case 'invalid_email':
        return 'E-mail inválido.';
      case 'already_configured':
        return 'Essa conta já foi criada — recarregue a página e entre normalmente.';
      case 'too_many_requests':
        return 'Muitas tentativas seguidas — espere alguns minutos e tente de novo.';
      default:
        return 'Não deu certo. Tente de novo.';
    }
  }
  return 'Não foi possível falar com o servidor.';
}

export function Login({ needsSetup, onAuthenticated }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const result = needsSetup ? await setup(email, password) : await login(email, password);
      onAuthenticated(result.email);
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-title">{needsSetup ? 'Criar conta' : 'Entrar'}</p>
      </header>

      <div className="step">
        <h1 className="step-title">{needsSetup ? 'Primeiro acesso' : 'Assistente Financeiro'}</h1>
        <p className="step-helper">
          {needsSetup
            ? 'Esse é o único login deste app — depois de criado, não existe cadastro aberto.'
            : 'Entre com o e-mail e a senha que você cadastrou.'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="login-email">
              E-mail
            </label>
            <input
              id="login-email"
              className="plain-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="login-password">
              Senha
            </label>
            <input
              id="login-password"
              className="plain-input"
              type="password"
              autoComplete={needsSetup ? 'new-password' : 'current-password'}
              minLength={needsSetup ? 8 : undefined}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {erro && <p className="reserve-warning">{erro}</p>}

          <button type="submit" className="btn btn-primary ask-btn" disabled={carregando}>
            {carregando ? 'Um instante…' : needsSetup ? 'Criar conta' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
