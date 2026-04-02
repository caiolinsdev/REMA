import type { DomainLifecycleState } from "../common/states";

export interface ContentSummary {
  id: string;
  title: string;
  subtitle: string;
  publishedAt: string;
  authorId: string;
  status: DomainLifecycleState;
  imageUrl?: string | null;
}

export interface ContentDetail extends ContentSummary {
  description: string;
  videoUrl?: string | null;
}

export interface UpsertContentRequest {
  title: string;
  subtitle: string;
  description: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
}
