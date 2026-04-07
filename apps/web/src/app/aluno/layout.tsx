import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";

const navItems = [
  { href: "/aluno", label: "Home" },
  { href: "/aluno/atividades", label: "Tarefas" },
  { href: "/aluno/conteudos", label: "Conteúdos" },
  { href: "/aluno/calendario", label: "Calendário" },
  { href: "/aluno/jogos", label: "Jogos" },
  { href: "/aluno/comunidade", label: "Comunidade" },
  { href: "/aluno/perfil", label: "Perfil" },
];

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard expectedRole="aluno" wrongRoleRedirect="/professor">
      <AppShell area="aluno" navItems={navItems}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
