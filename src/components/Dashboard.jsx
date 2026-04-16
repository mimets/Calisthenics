import { Building2, Coins, Plus, TrendingUp, Users } from 'lucide-react';
import { getGrandTotals, getGymTotals } from '../store';
import { formatCurrency } from '../utils/formatters';

function StatCard({ icon, label, value, helper }) {
  const IconComponent = icon;

  return (
    <div className="metric-strip rounded-[1.35rem] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-app-accent/12 text-app-accent">
          <IconComponent className="h-4 w-4" />
        </div>
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-app-muted">
          {label}
        </span>
      </div>
      <p className="metric-value text-app-text">{value}</p>
      <p className="mt-2 text-sm leading-6 text-app-muted">{helper}</p>
    </div>
  );
}

function EmptyState({ onAddGym }) {
  return (
    <div className="surface-panel rounded-[1.5rem] px-5 py-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1rem] bg-app-accent/12 text-app-accent">
        <Building2 className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-app-text">Nessuna palestra</h3>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Crea la prima sede per iniziare a gestire clienti e quote.
      </p>
      <button
        className="button-primary mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        onClick={onAddGym}
        type="button"
      >
        <Plus className="h-4 w-4" />
        Nuova palestra
      </button>
    </div>
  );
}

export default function Dashboard({ gyms, onAddGym, onNavigate }) {
  const totals = getGrandTotals(gyms);

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="surface-panel raise-in rounded-[1.5rem] px-4 py-4 lg:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Dashboard</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-app-text">
              Panoramica veloce
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-app-muted">
              Tutto quello che serve per leggere la situazione generale in pochi secondi.
            </p>
          </div>

          <button
            className="button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            onClick={onAddGym}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Nuova palestra
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            helper="Sedi presenti"
            icon={Building2}
            label="Palestre"
            value={totals.totalGyms}
          />
          <StatCard helper="Clienti attivi" icon={Users} label="Clienti" value={totals.totalClients} />
          <StatCard
            helper="Totale incassato"
            icon={TrendingUp}
            label="Lordo"
            value={formatCurrency(totals.lordo)}
          />
          <StatCard
            helper={`IVA ${formatCurrency(totals.iva)}`}
            icon={Coins}
            label="Netto"
            value={formatCurrency(totals.netto)}
          />
        </div>
      </section>

      {gyms.length === 0 ? (
        <EmptyState onAddGym={onAddGym} />
      ) : (
        <section className="surface-panel raise-in overflow-hidden rounded-[1.5rem]">
          <div className="ambient-line px-4 py-4 lg:px-5">
            <p className="section-kicker">Palestre</p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-app-text">Elenco sedi</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-app-muted">
              Ogni card mostra subito clienti e numeri principali della singola palestra.
            </p>
          </div>

          <div className="space-y-3 p-4 lg:p-5">
            {gyms.map((gym) => {
              const totalsByGym = getGymTotals(gym.clients);

              return (
                <button
                  className="surface-soft flex w-full flex-col gap-4 rounded-[1.25rem] px-4 py-4 text-left transition hover:-translate-y-[1px] hover:border-app-line-strong hover:bg-white/90"
                  key={gym.id}
                  onClick={() => onNavigate(`gym-${gym.id}`)}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[0.95rem] bg-app-accent/12 text-app-accent">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-app-text">{gym.name}</p>
                      <p className="text-sm text-app-muted">{gym.clients.length} clienti</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-app-muted">Lordo</p>
                      <p className="mt-1 text-sm font-semibold text-app-text">
                        {formatCurrency(totalsByGym.lordo)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-app-muted">Netto</p>
                      <p className="mt-1 text-sm font-semibold text-app-success">
                        {formatCurrency(totalsByGym.netto)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-app-muted">IVA</p>
                      <p className="mt-1 text-sm font-semibold text-app-warning">
                        {formatCurrency(totalsByGym.iva)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
