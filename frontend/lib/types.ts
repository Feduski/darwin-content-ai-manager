export type ItemType = "text" | "image";
export type OutputType = "text" | "image" | "both";
export type GenerationStatus = "pending" | "approved" | "rejected";

export interface InspoItem {
  id: string;
  type: ItemType;
  content: string;      // raw text or uploaded file path
  previewUrl?: string;  // for image preview in the UI
}

export interface Generation {
  id: number;
  created_at: string;
  inspo_items: Array<{ type: ItemType; content: string }>;
  user_comment: string | null;
  extracted_concept: string | null;
  output_type: OutputType;
  output_text: string | null;
  output_image_path: string | null;
  status: GenerationStatus;
  rejection_reason: string | null;
}

export interface BrandConfig {
  id: number;
  prompt_base: string;
  feedback_summary: string | null;
}

export interface BrandCorpusItem {
  id: number;
  source: string;
  source_url: string | null;
  text: string;
  image_path: string | null;
  notes: string | null;
  created_at: string;
}
