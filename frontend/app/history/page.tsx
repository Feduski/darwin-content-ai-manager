"use client";

import { useState, useEffect } from "react";
import { listGenerations } from "@/lib/api";
import type { Generation, GenerationStatus } from "@/lib/types";

const STATUS_STYLES: Record<GenerationStatus, string> = {
  pending: "bg-zinc-700 text-zinc-300",
  approved: "bg-emerald-900/60 text-emerald-400",
  rejected: "bg-red-900/40 text-red-400",
};

const STATUS_LABEL: Record<GenerationStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

function GenerationRow({ gen }: { gen: Generation }) {
  const date = new Date(gen.created_at).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const concept = gen.extracted_concept
    ? gen.extracted_concept.slice(0, 120) + (gen.extracted_concept.length > 120 ? "…" : "")
    : "—";

  const preview = gen.output_text
    ? gen.output_text.slice(0, 100) + (gen.output_text.length > 100 ? "…" : "")
    : gen.output_image_path
    ? "(imagen)"
    : "—";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500">{date}</p>
          <p className="mt-1 text-sm text-zinc-400 italic truncate">{concept}</p>
          <p className="mt-1 text-sm text-zinc-200">{preview}</p>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[gen.status]}`}>
          {STATUS_LABEL[gen.status]}
        </span>
      </div>
      {gen.status === "rejected" && gen.rejection_reason && (
        <p className="text-xs text-red-400/70 border-l-2 border-red-900/50 pl-2">
          {gen.rejection_reason}
        </p>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listGenerations()
      .then((data) => setGenerations(data as Generation[]))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Historia</h1>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 h-20" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && generations.length === 0 && (
        <p className="text-sm text-zinc-500 text-center py-12">
          Todavía no hay generaciones. Creá tu primer post desde{" "}
          <a href="/" className="text-zinc-300 hover:text-white underline underline-offset-2">
            Generar
          </a>
          .
        </p>
      )}

      {!loading && generations.map((gen) => (
        <GenerationRow key={gen.id} gen={gen} />
      ))}
    </div>
  );
}
