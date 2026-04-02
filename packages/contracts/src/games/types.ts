import type { DomainLifecycleState } from "../common/states";

export interface GameSummary {
  id: string;
  title: string;
  description: string;
  status: Extract<DomainLifecycleState, "draft" | "published" | "archived">;
}
