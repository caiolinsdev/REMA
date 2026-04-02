import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";

const navItems = [
  { href: "/aluno", label: "Home" },
  { href: "/aluno/atividades", label: "Provas / atividades / trabalhos" },
  { href: "/aluno/conteudos", label: "Conteudos" },
  { href: "/aluno/calendario", label: "Calendario" },
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
