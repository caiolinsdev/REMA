# Wave 1.5 — Guards e controlo de acesso

## Web (`apps/web`)

| Camada        | O que faz |
|---------------|-----------|
| `middleware`  | Sem `rema_token`, bloqueia `/aluno/*` e `/professor/*` → redireciona para `/login`. Com token em `/login`, redireciona para `/aluno` ou `/professor` conforme `rema_role`. |
| `RoleGuard`   | Após cookie presente, chama `GET /api/auth/me/`. Se 401, limpa cookies → `/login`. Se `role` ≠ área esperada, redireciona para a área do outro papel (`/aluno` ↔ `/professor`). |

Regras:

- Aluno não fica na shell de professor (e vice-versa), com base na resposta real da API, não só no cookie de papel.

## Mobile (`apps/mobile`)

- Sem token → ecrã de login (stack única).
- Com token → `apiMe` no arranque; falha → limpa armazenamento e login.
- Navegação autenticada: drawer **aluno** inclui “Jogos”; drawer **professor** não inclui. Não há URLs cruzadas entre shells.

## API

- Endpoints futuros por módulo devem usar permissões por papel (ex.: `IsAuthenticated` + verificação de `request.user.profile.role`) — aplicado nas waves de domínio.

## Sessão expirada

- **401** em `me` ou noutros endpoints: cliente trata como sessão inválida, remove token e regressa ao login.
