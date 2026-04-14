import { useState } from 'react';
import { Building2, LoaderCircle, Plus, X } from 'lucide-react';

export default function GymModal({ busy, onClose, onSave }) {
  const [name, setName] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    await onSave(name.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 px-4 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="surface-panel raise-in w-full max-w-lg rounded-[2rem] border border-white/10"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="ambient-line flex items-start justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-app-accent/16 text-app-accent">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="section-kicker">Nuova palestra</p>
              <h3 className="display-font mt-2 text-2xl font-semibold tracking-[-0.04em] text-app-text">
                Aggiungi una nuova sede
              </h3>
            </div>
          </div>

          <button
            aria-label="Chiudi modal"
            className="button-secondary rounded-full p-3"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="px-6 py-6" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-app-muted">Nome palestra</span>
            <div className="field-shell flex items-center gap-3 rounded-[1.25rem] px-4 py-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-white/[0.04] text-app-accent">
                <Building2 className="h-4 w-4" />
              </div>
              <input
                autoFocus
                className="w-full bg-transparent text-sm text-app-text outline-none placeholder:text-app-muted/55"
                onChange={(event) => setName(event.target.value)}
                placeholder="Es. Hermann Roma Centro"
                required
                value={name}
              />
            </div>
          </label>

          <div className="surface-soft mt-5 rounded-[1.35rem] px-4 py-4">
            <p className="text-sm leading-6 text-app-muted">
              La sede verra aggiunta subito al menu laterale e potrai iniziare a inserire i clienti.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              className="button-primary inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
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
                  <Plus className="h-4 w-4" />
                  Crea palestra
                </>
              )}
            </button>
            <button
              className="button-secondary rounded-full px-5 py-3 text-sm font-semibold"
              onClick={onClose}
              type="button"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
