import type { DomainLifecycleState } from "../common/states";

export type CommunityAudience = "alunos" | "professores";

export interface CommunityPostSummary {
  id: string;
  authorId: string;
  audience: CommunityAudience;
  title: string;
  body: string;
  status: DomainLifecycleState;
  createdAt: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  gifUrl?: string | null;
}

export interface CommunityModerationStatus {
  postId: string;
  status: "pending_review" | "approved" | "rejected";
  moderatedBy?: string | null;
  moderatedAt?: string | null;
  comment?: string | null;
}
