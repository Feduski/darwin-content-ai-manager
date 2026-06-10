"use client";

import { useState, useRef, useCallback } from "react";
import type { InspoItem, OutputType, Generation } from "@/lib/types";
import { uploadInspoImage, generatePost, submitFeedback } from "@/lib/api";

let _idCounter = 0;
function uid() { return `item-${++_idCounter}`; }
function newTextItem(): InspoItem {
  return { id: uid(), type: "text", content: "" };
}

// ── InspoItemCard ─────────────────────────────────────────────────────────────

function InspoItemCard({
  item,
  onChange,
  onRemove,
  canRemove,
}: {
  item: InspoItem;
  onChange: (id: string, patch: Partial<InspoItem>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { path } = await uploadInspoImage(file);
      onChange(item.id, { content: path, previewUrl: URL.createObjectURL(file) });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-lg bg-zinc-800 p-0.5 gap-0.5">
          {(["text", "image"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onChange(item.id, { type: t, content: "", previewUrl: undefined })}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                item.type === t
                  ? "bg-zinc-600 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t === "text" ? "Texto" : "Foto"}
            </button>
          ))}
        </div>
        {canRemove && (
          <button
            onClick={() => onRemove(item.id)}
            className="text-zinc-600 hover:text-zinc-300 transition-colors"
            aria-label="Eliminar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {item.type === "text" ? (
        <textarea
          value={item.content}
          onChange={(e) => onChange(item.id, { content: e.target.value })}
          placeholder="Pegá el texto de inspiración..."
          rows={4}
          className="w-full resize-none rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition"
        />
      ) : (
        <div>
          {item.previewUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt="Inspiración" className="rounded-lg max-h-48 object-cover w-full" />
              <button
                onClick={() => { onChange(item.id, { content: "", previewUrl: undefined }); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute top-2 right-2 bg-zinc-900/80 rounded-full p-1 text-zinc-300 hover:text-white"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center gap-2 h-32 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${uploading ? "border-zinc-600 bg-zinc-800/40" : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/20 hover:bg-zinc-800/40"}`}>
              {uploading ? (
                <span className="text-xs text-zinc-400">Subiendo...</span>
              ) : (
                <>
                  <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-zinc-500">Subí o arrastrá una imagen</span>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
            </label>
          )}
          {uploadError && <p className="mt-1.5 text-xs text-red-400">{uploadError}</p>}
        </div>
      )}
    </div>
  );
}

// ── ResultCard ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-400">Copiado</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copiar
        </>
      )}
    </button>
  );
}

function SaveButton({ text, filename }: { text: string; filename: string }) {
  function save() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button
      onClick={save}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Guardar
    </button>
  );
}

function ResultCard({ generation, onFeedback }: { generation: Generation; onFeedback: (d: "approved" | "rejected", r?: string) => void }) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const saveFilename = `darwin-post-${generation.id}-${new Date(generation.created_at).toISOString().slice(0, 10)}.txt`;

  if (generation.status !== "pending") {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-center">
        <span className={`text-sm font-medium ${generation.status === "approved" ? "text-emerald-400" : "text-red-400"}`}>
          {generation.status === "approved" ? "✓ Aprobado" : "✗ Rechazado"}
        </span>
      </div>
    );
  }

  async function approve() { setSubmitting(true); onFeedback("approved"); }
  async function reject() {
    if (!showReject) { setShowReject(true); return; }
    setSubmitting(true);
    onFeedback("rejected", reason || undefined);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
      {generation.extracted_concept && (
        <p className="text-xs text-zinc-500 border-l-2 border-zinc-700 pl-3 italic">
          <span className="text-zinc-400 not-italic font-medium">Concepto:</span>{" "}
          {generation.extracted_concept}
        </p>
      )}
      {generation.output_text && (
        <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{generation.output_text}</p>
      )}
      {generation.output_image_path && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`http://localhost:8000/${generation.output_image_path}`} alt="Imagen generada" className="rounded-lg w-full object-cover max-h-96" />
      )}
      {generation.output_text && (
        <div className="flex gap-2 pt-1">
          <CopyButton text={generation.output_text} />
          <SaveButton text={generation.output_text} filename={saveFilename} />
        </div>
      )}
      {showReject && (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="¿Por qué rechazás? (opcional)"
          rows={2}
          className="w-full resize-none rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        />
      )}
      <div className="flex gap-3 pt-1">
        <button onClick={approve} disabled={submitting} className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-medium text-white transition-colors">
          ✓ Aprobar
        </button>
        <button onClick={reject} disabled={submitting} className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-red-900/60 border border-zinc-700 hover:border-red-800 disabled:opacity-50 text-sm font-medium text-zinc-300 hover:text-red-300 transition-colors">
          {showReject ? "Confirmar rechazo" : "✗ Rechazar"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const CACHE_KEY = "darwin_last_result";

export default function HomePage() {
  const [items, setItems] = useState<InspoItem[]>([newTextItem()]);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [outputType, setOutputType] = useState<OutputType>("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Generation | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const updateItem = useCallback((id: string, patch: Partial<InspoItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  function setAndCacheResult(gen: Generation | null) {
    setResult(gen);
    try {
      if (gen) localStorage.setItem(CACHE_KEY, JSON.stringify(gen));
      else localStorage.removeItem(CACHE_KEY);
    } catch { /* storage lleno o modo privado */ }
  }

  async function handleGenerate() {
    const valid = items.filter((i) => i.content.trim());
    if (!valid.length) { setError("Agregá al menos un item de inspiración con contenido."); return; }
    setLoading(true);
    setError(null);
    setAndCacheResult(null);
    try {
      const gen = await generatePost({
        inspo_items: valid.map((i) => ({ type: i.type, content: i.content })),
        user_comment: comment.trim() || undefined,
        output_type: outputType,
      }) as Generation;
      setAndCacheResult(gen);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al generar");
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedback(decision: "approved" | "rejected", reason?: string) {
    if (!result) return;
    try {
      await submitFeedback(result.id, decision, reason);
      const updated = { ...result, status: decision };
      setAndCacheResult(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar feedback");
    }
  }

  return (
    <div className="space-y-6">
      {/* Inspiración */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Inspiración</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <InspoItemCard key={item.id} item={item} onChange={updateItem} onRemove={removeItem} canRemove={items.length > 1} />
          ))}
        </div>
        <button onClick={() => setItems((p) => [...p, newTextItem()])} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar referencia
        </button>
      </section>

      {/* Comentario */}
      <section className="space-y-2">
        <button onClick={() => setShowComment((v) => !v)} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg className={`w-3.5 h-3.5 transition-transform ${showComment ? "rotate-45" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showComment ? "Ocultar comentario" : "Agregar comentario"}
        </button>
        {showComment && (
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Indicaciones adicionales para esta campaña..."
            rows={3}
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition"
          />
        )}
      </section>

      {/* Output + Generate */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 mr-1">Output:</span>
          <div className="flex rounded-lg bg-zinc-900 border border-zinc-800 p-0.5 gap-0.5">
            {(["text", "image", "both"] as OutputType[]).map((t) => (
              <button key={t} onClick={() => setOutputType(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${outputType === t ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"}`}>
                {t === "both" ? "Ambos" : t === "text" ? "Texto" : "Imagen"}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="px-5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-semibold disabled:opacity-40 transition-colors">
          {loading ? "Generando..." : "Generar →"}
        </button>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3 animate-pulse">
          <div className="h-3 bg-zinc-800 rounded w-2/3" />
          <div className="h-3 bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-zinc-800 rounded w-4/5" />
          <div className="h-3 bg-zinc-800 rounded w-3/5" />
        </div>
      )}

      {/* Resultado */}
      {result && !loading && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Resultado</h2>
          <ResultCard generation={result} onFeedback={handleFeedback} />
        </section>
      )}
    </div>
  );
}
