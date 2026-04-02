# Wave 1.1 — Especificação de autenticação

Saida da micro-wave 1.1. Endpoints alinhados a `docs/api-discovery.md`.

## Estratégia de sessão

- **Sessão tokenizada própria** da API (`Authorization: Token <key>`), persistida por login.
- Uma única API para web e mobile; sem duplicar regras de papel no cliente como fonte de verdade (o backend valida em cada recurso protegido nas waves seguintes).
- Cada login cria uma sessão independente; terminar sessão num cliente não invalida automaticamente as restantes.
- **Web (Next.js)**: após o login, o token e o papel são guardados em cookies não-httpOnly (`rema_token`, `rema_role`) para o `middleware` redirecionar rotas públicas/privadas. Em produção, preferir BFF ou cookies httpOnly.
- **Mobile (Expo)**: token em `AsyncStorage` (`rema_token`); papel inferido de `GET /api/auth/me/` após arranque. O cliente usa `10.0.2.2` por omissao no Android emulator quando `EXPO_PUBLIC_API_URL` nao estiver definida.

## `POST /api/auth/login/`

**Request** (`application/json`), ver `LoginRequest` em `@rema/contracts`:

```json
{ "email": "string", "password": "string" }
```

**Resposta 200** — `AuthSessionResponse`:

```json
{
  "token": "<drf-token>",
  "user": {
    "id": "1",
    "name": "Aluno Demo",
    "email": "aluno@demo.local",
    "role": "aluno",
    "profile": {
      "userId": "1",
      "role": "aluno",
      "displayName": "Aluno Demo",
      "avatarUrl": null,
      "bio": null
    }
  }
}
```

**Erros**

| HTTP | `code`               | Descrição                          |
|------|----------------------|------------------------------------|
| 400  | `invalid_body`       | `email` ou `password` em falta     |
| 401  | `invalid_credentials`| Utilizador ou senha incorretos     |
| 403  | `no_profile`         | Utilizador sem `UserProfile`       |

## `GET /api/auth/me/`

- **Auth**: `Authorization: Token <key>`.
- **200**: mesmo objeto `user` do login (`MeResponse` nos contratos).

**Erros**

| HTTP | Comportamento cliente                          |
|------|-----------------------------------------------|
| 401  | Token inválido ou revogado → tratar como sessão expirada: limpar credenciais e voltar ao login. |

## `POST /api/auth/logout/`

- **Auth**: `Authorization: Token <key>`.
- **204**: apenas a sessão/token atual é revogada no servidor.
- Cliente deve apagar token local (cookies ou `AsyncStorage`).

## Resolução de `role`

- Origem: `UserProfile.role` na API (`aluno` | `professor`).
- Clientes usam `user.role` para escolher shell (rotas web `/aluno/*` vs `/professor/*`; drawer mobile com ou sem “Jogos”).

## Utilizadores demo

```bash
./apps/api/.venv/bin/python ./apps/api/manage.py seed_demo_users
```

- `aluno@demo.local` / `demo123`
- `professor@demo.local` / `demo123`

## Observações de implementação

- O login nao depende de unicidade hard de `email` no `django.contrib.auth.models.User`; a API autentica os candidatos pelo par `email + password` e falha de forma segura se houver ambiguidade.
