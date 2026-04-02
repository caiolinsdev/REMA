/**
 * Estados de ciclo de vida compartilhados entre dominios.
 * Ver docs/transformation/wave-0-foundation.md (micro-wave 0.4).
 */
export type DomainLifecycleState =
  | "draft"
  | "published"
  | "pending_review"
  | "submitted"
  | "reviewed"
  | "approved"
  | "rejected"
  | "archived";
