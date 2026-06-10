"use client";

import { useState, useEffect } from "react";
import {
  getBrandConfig,
  updateBrandConfig,
  listCorpus,
  addCorpusItem,
  deleteCorpusItem,
} from "@/lib/api";
import type { BrandConfig, BrandCorpusItem } from "@/lib/types";

// ── Brand Config section ──────────────────────────────────────────────────────

function BrandConfigSection() {
  const [config, setConfig] = useState<BrandConfig | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getBrandConfig()
      .then((c) => { setConfig(c as BrandConfig); setDraft((c as BrandConfig).prompt_base); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error al cargar config"));
  }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateBrandConfig(draft) as BrandConfig;
      setConfig(updated);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Prompt base de marca
        </h2>
        {!editing && config && (
          <button onClick={() => setEditing(true)} className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
            Editar
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {config && !editing && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {config.prompt_base}
        </div>
      )}

      {config && editing && (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition"
          />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold disabled:opacity-40 transition-colors">
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={() => { setEditing(false); setDraft(config.prompt_base); }} className="px-4 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {success && <p className="text-xs text-emerald-400">✓ Guardado</p>}

      {config?.feedback_summary && (
        <div className="mt-4 space-y-1">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Preferencias aprendidas</p>
          <p className="text-sm text-zinc-400 italic leading-relaxed">{config.feedback_summary}</p>
        </div>
      )}
    </div>
  );
}

// ── Source badge ──────────────────────────────────────────────────────────────

const SOURCE_STYLES: Record<string, string> = {
  instagram: "bg-pink-950/60 text-pink-400 border-pink-900/40",
  linkedin: "bg-blue-950/60 text-blue-400 border-blue-900/40",
  manual: "bg-zinc-800 text-zinc-400 border-zinc-700",
};

function SourceBadge({ source }: { source: string }) {
  const style = SOURCE_STYLES[source] ?? SOURCE_STYLES.manual;
  return (
    <span className={`shrink-0 px-2 py-0.5 rounded border text-xs font-medium ${style}`}>
      {source}
    </span>
  );
}

// ── Corpus section ────────────────────────────────────────────────────────────

const EMPTY_FORM = { source: "instagram", source_url: "", text: "", notes: "" };

function CorpusSection() {
  const [items, setItems] = useState<BrandCorpusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCorpus()
      .then((data) => setItems(data as BrandCorpusItem[]))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!form.text.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const item = await addCorpusItem({
        source: form.source,
        source_url: form.source_url.trim() || undefined,
        text: form.text.trim(),
        notes: form.notes.trim() || undefined,
      }) as BrandCorpusItem;
      setItems((p) => [item, ...p]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al agregar");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteCorpusItem(id);
      setItems((p) => p.filter((i) => i.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Corpus de marca
          {!loading && (
            <span className="ml-2 normal-case font-normal text-zinc-600">({items.length} posts)</span>
          )}
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {showForm ? "Cancelar" : "+ Agregar post"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {showForm && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-zinc-500">Fuente</label>
              <select
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              >
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div className="flex-[2] space-y-1">
              <label className="text-xs text-zinc-500">URL (opcional)</label>
              <input
                type="url"
                value={form.source_url}
                onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Texto del post</label>
            <textarea
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              rows={4}
              placeholder="Pegá el caption del post..."
              className="w-full resize-none rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Notas de estilo (opcional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Ej: tono humorístico, CTA a comentarios..."
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !form.text.trim()}
            className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold disabled:opacity-40 transition-colors"
          >
            {adding ? "Agregando..." : "Agregar al corpus"}
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl border border-zinc-800 bg-zinc-900" />)}
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-sm text-zinc-500 text-center py-8">
          No hay posts en el corpus. Corré el seed script o agregá uno manualmente.
        </p>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <SourceBadge source={item.source} />
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm text-zinc-200 line-clamp-2">{item.text}</p>
              {item.notes && (
                <p className="text-xs text-zinc-500 italic">{item.notes}</p>
              )}
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors truncate block"
                >
                  {item.source_url}
                </a>
              )}
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="shrink-0 text-zinc-700 hover:text-red-400 transition-colors mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BrandPage() {
  return (
    <div className="space-y-10">
      <BrandConfigSection />
      <div className="border-t border-zinc-800" />
      <CorpusSection />
    </div>
  );
}
