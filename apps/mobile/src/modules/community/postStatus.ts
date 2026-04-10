import type { CommunityPostSummary } from "@rema/contracts";

export function communityPostStatusLabel(status: CommunityPostSummary["status"]): string {
  const map: Record<string, string> = {
    draft: "Rascunho",
    published: "Publicado",
    pending_review: "Em moderação",
    submitted: "Enviado",
    reviewed: "Revisado",
    approved: "Aprovado",
    rejected: "Rejeitado",
    archived: "Arquivado",
  };
  return map[status] ?? status;
}

export function communityPostStatusColor(status: CommunityPostSummary["status"]): string {
  if (status === "approved" || status === "published") return "#166534";
  if (status === "rejected") return "#b91c1c";
  if (status === "pending_review" || status === "draft") return "#92400e";
  return "#64748b";
}
