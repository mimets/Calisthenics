import { useState } from 'react';
import {
  Building2,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export default function Sidebar({ currentView, gyms, onNavigate, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...gyms.map((gym) => ({ id: `gym-${gym.id}`, label: gym.name, icon: Dumbbell })),
  ];

  const handleNavigate = (id) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 lg:hidden">
        <div className="surface-panel flex items-center justify-between rounded-[1.35rem] px-4 py-3">
          <button className="flex items-center gap-3" onClick={() => handleNavigate('dashboard')} type="button">
            <div className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-white/10 text-app-text">
              <span className="text-sm font-bold tracking-[-0.06em]">HM</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-app-text">Hermann Manager</p>
              <p className="text-xs text-app-muted">{gyms.length} palestre</p>
            </div>
          </button>

          <button
            className="button-secondary rounded-full p-3"
            onClick={() => setMobileOpen((value) => !value)}
            type="button"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <button
          aria-label="Chiudi menu"
          className="fixed inset-0 z-40 bg-black/28 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[18.5rem] px-3 pb-3 pt-4 transition-transform duration-300 lg:static lg:block lg:w-[17rem] lg:px-4 lg:pb-4 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="surface-panel flex h-full flex-col rounded-[1.7rem] p-4">
          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-white/10 text-app-text">
              <span className="text-sm font-bold tracking-[-0.06em]">HM</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-app-text">Hermann Manager</p>
              <p className="text-xs text-app-muted">Workspace mobile first</p>
            </div>
          </div>

          <div className="mt-2 rounded-[1.25rem] border border-white/10 bg-white/5 px-3.5 py-3 lg:mt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-app-accent/18 text-app-accent">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-app-muted">Attivita</p>
                <p className="text-sm font-semibold text-app-text">
                  {gyms.reduce((sum, gym) => sum + gym.clients.length, 0)} clienti totali
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex-1 overflow-y-auto">
            <p className="px-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-app-muted">
              Navigazione
            </p>

            <div className="mt-3 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    className={`flex w-full items-center gap-3 rounded-[1.15rem] px-3.5 py-3 text-left transition ${
                      isActive
                        ? 'border border-white/14 bg-white/10 text-app-text'
                        : 'text-app-muted hover:bg-white/7 hover:text-app-text'
                    }`}
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    type="button"
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-[0.9rem] ${
                        isActive ? 'bg-app-accent/18 text-app-accent' : 'bg-white/7'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="truncate text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className="button-secondary mt-4 flex items-center gap-3 rounded-[1.15rem] px-3.5 py-3 text-left"
            onClick={onLogout}
            type="button"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-white/7">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Esci</span>
          </button>
        </div>
      </aside>
    </>
  );
}
