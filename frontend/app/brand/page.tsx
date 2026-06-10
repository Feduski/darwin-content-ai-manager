"use client";

import { useState, useEffect } from "react";
import {
  getBrandConfig,
  updateBrandConfig,
  listCorpus,
  addCorpusText,
  addCorpusImage,
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

// ── Corpus section ────────────────────────────────────────────────────────────

function CorpusSection() {
  const [items, setItems] = useState<BrandCorpusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState<"text" | "image" | null>(null);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCorpus()
      .then((data) => setItems(data as BrandCorpusItem[]))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  async function handleAddText() {
    if (!newText.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const item = await addCorpusText(newText.trim()) as BrandCorpusItem;
      setItems((p) => [item, ...p]);
      setNewText("");
      setAddMode(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al agregar");
    } finally {
      setAdding(false);
    }
  }

  async function handleAddImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdding(true);
    setError(null);
    try {
      const item = await addCorpusImage(file) as BrandCorpusItem;
      setItems((p) => [item, ...p]);
      setAddMode(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al subir");
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
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setAddMode("text")} className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
            + Texto
          </button>
          <button onClick={() => setAddMode("image")} className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
            + Imagen
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {addMode === "text" && (
        <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Post propio como ejemplo de estilo</p>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={4}
            placeholder="Pegá un post de tu marca..."
            className="w-full resize-none rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          />
          <div className="flex gap-2">
            <button onClick={handleAddText} disabled={adding || !newText.trim()} className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold disabled:opacity-40">
              {adding ? "Agregando..." : "Agregar"}
            </button>
            <button onClick={() => { setAddMode(null); setNewText(""); }} className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {addMode === "image" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
          <p className="text-xs text-zinc-500">Imagen de tu marca para análisis de estilo</p>
          <label className="flex flex-col items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-600 cursor-pointer transition-colors">
            {adding ? <span className="text-xs text-zinc-400">Subiendo...</span> : <span className="text-xs text-zinc-500">Seleccioná una imagen</span>}
            <input type="file" accept="image/*" className="hidden" onChange={handleAddImage} disabled={adding} />
          </label>
          <button onClick={() => setAddMode(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Cancelar</button>
        </div>
      )}

      {loading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl border border-zinc-800 bg-zinc-900" />)}
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-sm text-zinc-500 text-center py-8">
          No hay ejemplos en el corpus todavía. Agregá posts de tu marca.
        </p>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <span className="shrink-0 mt-0.5 text-xs text-zinc-600 uppercase font-medium w-10">{item.type}</span>
            <div className="flex-1 min-w-0">
              {item.type === "text" ? (
                <p className="text-sm text-zinc-300 truncate">{item.content}</p>
              ) : (
                <p className="text-sm text-zinc-500 truncate">{item.content}</p>
              )}
              {item.style_description && (
                <p className="mt-0.5 text-xs text-zinc-500 italic truncate">{item.style_description}</p>
              )}
            </div>
            <button onClick={() => handleDelete(item.id)} className="shrink-0 text-zinc-700 hover:text-red-400 transition-colors">
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
