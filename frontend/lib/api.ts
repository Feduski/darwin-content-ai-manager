const BASE = "http://localhost:8000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Inspo ────────────────────────────────────────────────────────────────────
export async function uploadInspoImage(file: File): Promise<{ path: string; filename: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/inspo/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Generate ─────────────────────────────────────────────────────────────────
export interface GenerateRequest {
  inspo_items: Array<{ type: string; content: string }>;
  user_comment?: string;
  output_type: string;
}

export async function generatePost(body: GenerateRequest) {
  return request("/generate", { method: "POST", body: JSON.stringify(body) });
}

export async function listGenerations(skip = 0, limit = 20) {
  return request(`/generations?skip=${skip}&limit=${limit}`);
}

export async function getGeneration(id: number) {
  return request(`/generate/${id}`);
}

// ── Feedback ─────────────────────────────────────────────────────────────────
export async function submitFeedback(generation_id: number, decision: "approved" | "rejected", rejection_reason?: string) {
  return request("/feedback", {
    method: "POST",
    body: JSON.stringify({ generation_id, decision, rejection_reason }),
  });
}

// ── Brand ────────────────────────────────────────────────────────────────────
export async function getBrandConfig() {
  return request("/brand/config");
}

export async function updateBrandConfig(prompt_base: string) {
  return request("/brand/config", { method: "PUT", body: JSON.stringify({ prompt_base }) });
}

export async function listCorpus() {
  return request("/brand/corpus");
}

export async function addCorpusText(content: string) {
  const form = new FormData();
  form.append("content", content);
  const res = await fetch(`${BASE}/brand/corpus/text`, { method: "POST", body: form });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function addCorpusImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/brand/corpus/image`, { method: "POST", body: form });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function deleteCorpusItem(id: number) {
  return request(`/brand/corpus/${id}`, { method: "DELETE" });
}
