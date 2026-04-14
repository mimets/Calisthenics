import { useCallback, useEffect, useState } from 'react';
import { Building2, LoaderCircle, Sparkles } from 'lucide-react';
import {
  createGym,
  createClient,
  deleteClient,
  deleteGym,
  getGyms,
  getSession,
  loginRequest,
  logoutRequest,
  updateClient,
  updateGym as updateGymRequest,
} from './api';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GymView from './components/GymView';
import GymModal from './components/GymModal';

function PageHeader({ currentGym, gymCount }) {
  return (
    <header className="ambient-line px-4 pb-5 pt-4 lg:px-8 lg:pt-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <span className="eyebrow-chip rounded-full">
            <Sparkles className="h-3.5 w-3.5" />
            {currentGym ? 'Dettaglio palestra' : 'Gestionale mobile'}
          </span>

          <div>
            <h1 className="display-font text-[1.8rem] font-semibold tracking-[-0.05em] text-app-text sm:text-[2.2rem]">
              {currentGym ? currentGym.name : 'Hermann Manager'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">
              {currentGym
                ? 'Clienti e quote della sede selezionata in una vista piu semplice.'
                : 'Gestisci palestre, clienti e numeri con auth lato server e persistenza su database.'}
            </p>
          </div>
        </div>

        <div className="surface-soft flex items-center gap-3 rounded-[1.25rem] px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-app-accent/18 text-app-accent">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-app-muted">
              Palestre attive
            </p>
            <p className="text-lg font-semibold text-app-text">{gymCount}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function FullScreenState({ label }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-panel flex items-center gap-3 rounded-[1.4rem] px-5 py-4 text-sm text-app-text">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState({ gyms: [] });
  const [currentView, setCurrentView] = useState('dashboard');
  const [showGymModal, setShowGymModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refreshData = useCallback(async () => {
    const payload = await getGyms();
    setData({ gyms: payload.gyms });
    return payload.gyms;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const session = await getSession();

        if (!mounted) {
          return;
        }

        if (session.authenticated) {
          setAuthed(true);
          await refreshData();
        }
      } catch {
        if (mounted) {
          setAuthed(false);
        }
      } finally {
        if (mounted) {
          setAuthReady(true);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [refreshData]);

  const runAction = useCallback(async (action) => {
    setBusy(true);
    setError('');

    try {
      return await action();
    } catch (actionError) {
      setError(actionError.message);
      throw actionError;
    } finally {
      setBusy(false);
    }
  }, []);

  const handleLogin = async (username, password) => {
    try {
      await runAction(() => loginRequest(username, password));
      setAuthed(true);
      await refreshData();
      return null;
    } catch (loginError) {
      return loginError.message;
    }
  };

  const handleLogout = async () => {
    await runAction(() => logoutRequest());
    setAuthed(false);
    setData({ gyms: [] });
    setCurrentView('dashboard');
  };

  const handleAddGym = async (name) => {
    const gym = await runAction(() => createGym(name));
    await refreshData();
    setCurrentView(`gym-${gym.id}`);
  };

  const handleUpdateGym = async (gymId, name) => {
    await runAction(() => updateGymRequest(gymId, name));
    await refreshData();
  };

  const handleDeleteGym = async (gymId) => {
    await runAction(() => deleteGym(gymId));
    await refreshData();
    setCurrentView('dashboard');
  };

  const handleAddClient = async (gymId, payload) => {
    await runAction(() => createClient(gymId, payload));
    await refreshData();
  };

  const handleUpdateClient = async (clientId, payload) => {
    await runAction(() => updateClient(clientId, payload));
    await refreshData();
  };

  const handleDeleteClient = async (clientId) => {
    await runAction(() => deleteClient(clientId));
    await refreshData();
  };

  if (!authReady) {
    return <FullScreenState label="Caricamento sessione..." />;
  }

  if (!authed) {
    return <Login onLogin={handleLogin} />;
  }

  const currentGymId = currentView.startsWith('gym-') ? currentView.replace('gym-', '') : null;
  const currentGym = currentGymId ? data.gyms.find((gym) => gym.id === currentGymId) : null;

  return (
    <div className="app-shell">
      <div className="absolute left-[-7rem] top-[-5rem] h-56 w-56 rounded-full bg-app-accent/18 blur-[90px] glow-drift" />
      <div className="absolute bottom-[-6rem] right-[-4rem] h-48 w-48 rounded-full bg-emerald-300/12 blur-[90px] glow-drift" />

      <Sidebar
        currentView={currentView}
        gyms={data.gyms}
        onLogout={handleLogout}
        onNavigate={setCurrentView}
      />

      <div className="app-main">
        <div className="page-frame overflow-hidden rounded-[1.8rem] lg:rounded-[2rem]">
          <PageHeader currentGym={currentGym} gymCount={data.gyms.length} />

          <main className="px-4 pb-5 lg:px-8 lg:pb-8">
            {error && (
              <div className="mb-4 rounded-[1rem] border border-red-300/14 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            {currentView === 'dashboard' ? (
              <Dashboard
                gyms={data.gyms}
                onAddGym={() => setShowGymModal(true)}
                onNavigate={setCurrentView}
              />
            ) : currentGym ? (
              <GymView
                busy={busy}
                gym={currentGym}
                onAddClient={handleAddClient}
                onBack={() => setCurrentView('dashboard')}
                onDeleteClient={handleDeleteClient}
                onDeleteGym={handleDeleteGym}
                onUpdateClient={handleUpdateClient}
                onUpdateGym={handleUpdateGym}
              />
            ) : (
              <div className="surface-panel raise-in rounded-[1.6rem] px-5 py-8 text-center">
                <p className="section-kicker">Elemento non trovato</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-app-text">
                  La palestra non e piu disponibile
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-app-muted">
                  Torna alla dashboard per rientrare in una vista valida.
                </p>
                <button
                  className="button-primary mt-5 rounded-full px-5 py-3 text-sm font-semibold"
                  onClick={() => setCurrentView('dashboard')}
                  type="button"
                >
                  Torna alla dashboard
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {showGymModal && (
        <GymModal
          busy={busy}
          onClose={() => setShowGymModal(false)}
          onSave={async (name) => {
            await handleAddGym(name);
            setShowGymModal(false);
          }}
        />
      )}
    </div>
  );
}
