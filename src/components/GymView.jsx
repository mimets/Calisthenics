import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Edit3,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { calcFinancials, getGymTotals } from '../store';
import { formatCurrency } from '../utils/formatters';

const FREQUENCY_OPTIONS = [
  { value: 'mensile', label: 'Mensile' },
  { value: 'trimestrale', label: 'Trimestrale' },
  { value: 'semestrale', label: 'Semestrale' },
  { value: 'annuale', label: 'Annuale' },
];

const FREQUENCY_CLASSNAMES = {
  mensile: 'bg-cyan-300/14 text-cyan-200',
  trimestrale: 'bg-violet-300/14 text-violet-200',
  semestrale: 'bg-amber-300/14 text-amber-200',
  annuale: 'bg-emerald-300/14 text-emerald-200',
};

function StatCard({ icon, label, value }) {
  const IconComponent = icon;

  return (
    <div className="metric-strip rounded-[1.25rem] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-white/10 text-app-accent">
          <IconComponent className="h-4 w-4" />
        </div>
        <span className="text-[0.68rem] uppercase tracking-[0.16em] text-app-muted">{label}</span>
      </div>
      <p className="text-lg font-semibold tracking-[-0.04em] text-app-text">{value}</p>
    </div>
  );
}

function AddClientForm({ busy, gymId, onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    price: '',
    frequency: 'mensile',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim() || !form.price) {
      return;
    }

    await onAdd(gymId, {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      price: Number(form.price) || 0,
      frequency: form.frequency,
    });

    setForm({
      firstName: '',
      lastName: '',
      price: '',
      frequency: 'mensile',
    });
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        className="button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Plus className="h-4 w-4" />
        Aggiungi cliente
      </button>
    );
  }

  return (
    <form className="surface-soft rounded-[1.35rem] p-4" onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-[-0.04em] text-app-text">Nuovo cliente</h3>
        <button className="button-secondary rounded-full p-2.5" onClick={() => setOpen(false)} type="button">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="field-shell rounded-[1rem] px-4 py-3">
          <input
            autoFocus
            className="w-full bg-transparent text-sm text-app-text outline-none placeholder:text-app-muted/55"
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            placeholder="Nome"
            required
            value={form.firstName}
          />
        </div>
        <div className="field-shell rounded-[1rem] px-4 py-3">
          <input
            className="w-full bg-transparent text-sm text-app-text outline-none placeholder:text-app-muted/55"
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            placeholder="Cognome"
            required
            value={form.lastName}
          />
        </div>
        <div className="field-shell rounded-[1rem] px-4 py-3">
          <input
            className="w-full bg-transparent text-sm text-app-text outline-none placeholder:text-app-muted/55"
            min="0"
            onChange={(event) => setForm({ ...form, price: event.target.value })}
            placeholder="Quota lorda"
            required
            step="0.01"
            type="number"
            value={form.price}
          />
        </div>
        <div className="field-shell flex items-center rounded-[1rem] px-4 py-3">
          <select
            className="w-full appearance-none bg-transparent text-sm text-app-text outline-none"
            onChange={(event) => setForm({ ...form, frequency: event.target.value })}
            value={form.frequency}
          >
            {FREQUENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 text-app-muted" />
        </div>
      </div>

      <button
        className="button-primary mt-4 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        disabled={busy}
        type="submit"
      >
        {busy ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Salvataggio...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Salva cliente
          </>
        )}
      </button>
    </form>
  );
}

function ClientEditor({ busy, form, onCancel, onChange, onSave }) {
  return (
    <div className="surface-soft grid gap-3 rounded-[1.25rem] border border-white/14 p-4 sm:grid-cols-2">
      <div className="field-shell rounded-[1rem] px-4 py-3">
        <input
          autoFocus
          className="w-full bg-transparent text-sm text-app-text outline-none"
          onChange={(event) => onChange({ ...form, firstName: event.target.value })}
          value={form.firstName}
        />
      </div>
      <div className="field-shell rounded-[1rem] px-4 py-3">
        <input
          className="w-full bg-transparent text-sm text-app-text outline-none"
          onChange={(event) => onChange({ ...form, lastName: event.target.value })}
          value={form.lastName}
        />
      </div>
      <div className="field-shell rounded-[1rem] px-4 py-3">
        <input
          className="w-full bg-transparent text-sm text-app-text outline-none"
          min="0"
          onChange={(event) => onChange({ ...form, price: event.target.value })}
          step="0.01"
          type="number"
          value={form.price}
        />
      </div>
      <div className="field-shell flex items-center rounded-[1rem] px-4 py-3">
        <select
          className="w-full appearance-none bg-transparent text-sm text-app-text outline-none"
          onChange={(event) => onChange({ ...form, frequency: event.target.value })}
          value={form.frequency}
        >
          {FREQUENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="h-4 w-4 text-app-muted" />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <button className="button-primary rounded-full px-4 py-3 text-sm font-semibold" disabled={busy} onClick={onSave} type="button">
          {busy ? 'Salvataggio...' : 'Salva'}
        </button>
        <button className="button-secondary rounded-full px-4 py-3 text-sm font-semibold" disabled={busy} onClick={onCancel} type="button">
          Annulla
        </button>
      </div>
    </div>
  );
}

function ClientList({ busy, clients, onDelete, onEdit }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const startEdit = (client) => {
    setEditingId(client.id);
    setDraft({
      ...client,
      price: String(client.price),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      return;
    }

    await onEdit(draft.id, {
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      price: Number(draft.price) || 0,
      frequency: draft.frequency,
    });

    cancelEdit();
  };

  return (
    <div className="space-y-3">
      {clients.map((client) => {
        const financials = calcFinancials(Number(client.price) || 0);
        const frequencyStyle = FREQUENCY_CLASSNAMES[client.frequency] || FREQUENCY_CLASSNAMES.mensile;

        if (editingId === client.id && draft) {
          return (
            <ClientEditor
              busy={busy}
              form={draft}
              key={client.id}
              onCancel={cancelEdit}
              onChange={setDraft}
              onSave={saveEdit}
            />
          );
        }

        return (
          <article className="surface-soft rounded-[1.25rem] px-4 py-4" key={client.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-white/10 text-sm font-semibold uppercase text-app-accent">
                    {client.firstName.slice(0, 1)}
                    {client.lastName.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-app-text">
                      {client.firstName} {client.lastName}
                    </p>
                    <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${frequencyStyle}`}>
                      {client.frequency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="button-secondary rounded-full p-2.5" disabled={busy} onClick={() => startEdit(client)} type="button">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  className="rounded-full border border-red-300/14 bg-red-400/10 p-2.5 text-red-200 transition hover:bg-red-400/16 disabled:opacity-60"
                  disabled={busy}
                  onClick={() => onDelete(client.id)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.16em] text-app-muted">Lordo</p>
                <p className="mt-1 text-sm font-semibold text-app-text">{formatCurrency(financials.lordo)}</p>
              </div>
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.16em] text-app-muted">Netto</p>
                <p className="mt-1 text-sm font-semibold text-emerald-300">{formatCurrency(financials.netto)}</p>
              </div>
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.16em] text-app-muted">IVA</p>
                <p className="mt-1 text-sm font-semibold text-amber-200">{formatCurrency(financials.iva)}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function GymView({
  busy,
  gym,
  onAddClient,
  onBack,
  onDeleteClient,
  onDeleteGym,
  onUpdateClient,
  onUpdateGym,
}) {
  const [editingName, setEditingName] = useState(false);
  const [gymName, setGymName] = useState(gym.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [search, setSearch] = useState('');

  const totals = getGymTotals(gym.clients);

  const saveGymName = async () => {
    if (!gymName.trim()) {
      return;
    }

    await onUpdateGym(gym.id, gymName.trim());
    setEditingName(false);
  };

  const filteredClients = gym.clients.filter((client) =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="surface-panel raise-in rounded-[1.5rem] px-4 py-4 lg:px-5">
        <button className="button-ghost inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm" disabled={busy} onClick={onBack} type="button">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            {editingName ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="field-shell rounded-[1rem] px-4 py-3">
                  <input
                    autoFocus
                    className="w-full min-w-[16rem] bg-transparent text-2xl font-semibold tracking-[-0.04em] text-app-text outline-none"
                    onChange={(event) => setGymName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        saveGymName();
                      }
                    }}
                    value={gymName}
                  />
                </div>
                <div className="flex gap-2">
                  <button className="button-primary rounded-full px-4 py-3 text-sm font-semibold" disabled={busy} onClick={saveGymName} type="button">
                    Salva
                  </button>
                  <button
                    className="button-secondary rounded-full px-4 py-3 text-sm font-semibold"
                    disabled={busy}
                    onClick={() => {
                      setGymName(gym.name);
                      setEditingName(false);
                    }}
                    type="button"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-[-0.05em] text-app-text sm:text-3xl">{gym.name}</h2>
                <button className="button-secondary rounded-full p-2.5" disabled={busy} onClick={() => setEditingName(true)} type="button">
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            )}

            <p className="mt-3 text-sm leading-6 text-app-muted">
              Gestione semplice di clienti, quote e ripartizione economica.
            </p>
          </div>

          <div className="w-full max-w-sm">
            {confirmDelete ? (
              <div className="rounded-[1.15rem] border border-red-300/14 bg-red-400/10 px-4 py-4">
                <p className="text-sm font-semibold text-red-100">Eliminare questa palestra?</p>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-full bg-red-300 px-4 py-3 text-sm font-semibold text-[#2b130f] disabled:opacity-60"
                    disabled={busy}
                    onClick={() => onDeleteGym(gym.id)}
                    type="button"
                  >
                    Elimina
                  </button>
                  <button className="button-secondary rounded-full px-4 py-3 text-sm font-semibold" disabled={busy} onClick={() => setConfirmDelete(false)} type="button">
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="button-secondary w-full rounded-[1.15rem] px-4 py-3 text-sm font-medium text-red-100"
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
                type="button"
              >
                Elimina palestra
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Users} label="Clienti" value={gym.clients.length} />
          <StatCard icon={Wallet} label="Lordo" value={formatCurrency(totals.lordo)} />
          <StatCard icon={Wallet} label="Netto" value={formatCurrency(totals.netto)} />
          <StatCard icon={Wallet} label="IVA" value={formatCurrency(totals.iva)} />
        </div>
      </section>

      <section className="surface-panel raise-in rounded-[1.5rem] px-4 py-4 lg:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker">Clienti</p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-app-text">Lista clienti</h3>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <AddClientForm busy={busy} gymId={gym.id} onAdd={onAddClient} />
            {gym.clients.length > 0 && (
              <label className="field-shell flex items-center gap-3 rounded-full px-4 py-3 lg:min-w-[16rem]">
                <Search className="h-4 w-4 text-app-muted" />
                <input
                  className="w-full bg-transparent text-sm text-app-text outline-none placeholder:text-app-muted/55"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cerca cliente"
                  value={search}
                />
              </label>
            )}
          </div>
        </div>

        <div className="mt-4">
          {gym.clients.length === 0 ? (
            <div className="surface-soft rounded-[1.25rem] px-5 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] bg-white/10 text-app-accent">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-app-text">Nessun cliente</h4>
              <p className="mt-2 text-sm leading-6 text-app-muted">
                Aggiungi il primo cliente per iniziare.
              </p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="surface-soft rounded-[1.25rem] px-5 py-8 text-center">
              <h4 className="text-lg font-semibold tracking-[-0.04em] text-app-text">Nessun risultato</h4>
              <p className="mt-2 text-sm leading-6 text-app-muted">
                Cambia il testo di ricerca per trovare un cliente.
              </p>
            </div>
          ) : (
            <ClientList busy={busy} clients={filteredClients} onDelete={onDeleteClient} onEdit={onUpdateClient} />
          )}
        </div>
      </section>
    </div>
  );
}
