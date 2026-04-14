import { useState } from 'react';
import { ArrowRight, Lock, User } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    window.setTimeout(async () => {
      const loginError = await onLogin(username, password);

      if (loginError) {
        setError(loginError);
      }

      setLoading(false);
    }, 320);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6">
      <div className="absolute left-[-5rem] top-[-3rem] h-40 w-40 rounded-full bg-app-accent/20 blur-[70px] glow-drift" />
      <div className="absolute bottom-[-4rem] right-[-4rem] h-44 w-44 rounded-full bg-emerald-300/12 blur-[80px] glow-drift" />

      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/12 bg-white/10 text-lg font-bold text-app-text backdrop-blur-xl">
            HM
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-app-text">Hermann Manager</h1>
          <p className="mt-2 text-sm leading-6 text-app-muted">
            Accesso rapido al gestionale con una UI piu semplice e pulita.
          </p>
        </div>

        <div className="surface-panel rounded-[1.8rem] p-5 sm:p-6">
          <div className="mb-6">
            <p className="section-kicker">Login</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-app-text">
              Entra nel workspace
            </h2>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">Username</span>
              <div className="field-shell flex items-center gap-3 rounded-[1.15rem] px-4 py-3.5">
                <User className="h-4 w-4 text-app-muted" />
                <input
                  autoComplete="username"
                  className="w-full bg-transparent text-sm text-app-text outline-none placeholder:text-app-muted/55"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Inserisci username"
                  required
                  type="text"
                  value={username}
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">Password</span>
              <div className="field-shell flex items-center gap-3 rounded-[1.15rem] px-4 py-3.5">
                <Lock className="h-4 w-4 text-app-muted" />
                <input
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm text-app-text outline-none placeholder:text-app-muted/55"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Inserisci password"
                  required
                  type="password"
                  value={password}
                />
              </div>
            </label>

            {error && (
              <div className="rounded-[1rem] border border-red-300/14 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              className="button-primary flex w-full items-center justify-center gap-2 rounded-[1.15rem] px-5 py-3.5 text-sm font-semibold"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Accesso in corso
                </>
              ) : (
                <>
                  Accedi
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
