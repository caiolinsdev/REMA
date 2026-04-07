import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";

const navItems = [
  { href: "/professor", label: "Home" },
  { href: "/professor/atividades", label: "Tarefas" },
  { href: "/professor/conteudos", label: "Conteúdos" },
  { href: "/professor/calendario", label: "Calendário" },
  { href: "/professor/comunidade", label: "Comunidade" },
  { href: "/professor/perfil", label: "Perfil" },
];

export default function ProfessorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard expectedRole="professor" wrongRoleRedirect="/aluno">
      <AppShell area="professor" navItems={navItems}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
