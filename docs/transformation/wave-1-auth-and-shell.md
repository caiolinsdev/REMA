# Wave 1: Auth and Shell

## Objetivo

Entregar o primeiro fluxo funcional do produto: autenticacao, descoberta de
papel e estrutura autenticada de navegacao para aluno e professor.

## Resultado Esperado

- login funcional
- sessao reconhecida em `web` e `mobile`
- redirecionamento por `role`
- shell autenticado separado por perfil

## Entradas

- `docs/user-flows.md`
- `docs/api-discovery.md`
- `docs/transformation/wave-0-foundation.md`

## Micro-wave 1.1: Spec de Auth

### Escopo

Definir:

- formato de login
- resposta de sessao
- resolucao de `role`
- estrategia de logout
- estados de erro e sessao expirada

### Endpoints base

- `POST /api/auth/login/`
- `GET /api/auth/me/`
- `POST /api/auth/logout/`

## Micro-wave 1.2: Shell Web

### Escopo

Criar a estrutura autenticada do `Next.js` com:

- layout do aluno
- layout do professor
- area protegida
- navegacao principal por modulo

### Navegacao inicial do aluno

- `Home`
- `Provas / atividades / trabalhos`
- `Conteudos`
- `Calendario`
- `Jogos`
- `Comunidade`
- `Perfil`

### Navegacao inicial do professor

- `Home`
- `Provas / atividades / trabalhos`
- `Conteudos`
- `Calendario`
- `Comunidade`
- `Perfil`

## Micro-wave 1.3: Shell Mobile

### Escopo

Criar a estrutura autenticada do `React Native` com:

- resolucao de sessao
- navegacao por papel
- areas principais ja mapeadas

### Decisoes esperadas

- stack para login
- tabs ou drawer para area autenticada
- rotas protegidas por perfil

## Micro-wave 1.4: API de Sessao

### Escopo

Implementar o minimo backend para sustentar:

- autenticacao
- leitura do usuario atual
- leitura de papel e perfil

### Dados minimos retornados por `me`

- `id`
- `name`
- `email`
- `role`
- `profile`

## Micro-wave 1.5: Guards e Access Control

### Escopo

Definir e aplicar:

- bloqueio de area anonima
- bloqueio por papel
- comportamento ao acessar area errada

### Regras base

- `Aluno` nao acessa area de professor
- `Professor` nao acessa area privada de aluno
- sessoes invalidas retornam para login

## Dependencias

- depende de `Wave 0`

## Critério de Pronto

- login utilizavel em pelo menos uma plataforma
- papel resolvido corretamente
- navegacao protegida documentada
- endpoints de sessao definidos

## Riscos

- decidir tarde a estrategia de sessao
- duplicar logica de papel no frontend e backend
- misturar navegacao publica e autenticada sem shell claro

## Implementacao (wave executada)

- **1.1** Spec: `docs/transformation/wave-1-auth-spec.md`; contratos `LoginRequest`, `AuthSessionResponse`, `MeResponse` em `packages/contracts/src/auth/session.ts`.
- **1.2** Web: `/login`, shells `/aluno/*` e `/professor/*`, `src/middleware.ts`, `RoleGuard`, `AppShell` com navegacao por modulo (professor sem item Jogos).
- **1.3** Mobile: stack login + drawer autenticado (`MainDrawer`), AsyncStorage + `AuthContext`, rotas por papel.
- **1.4** API: `core.auth_views` + `UserProfile`, DRF Token, `seed_demo_users`.
- **1.5** Documentado e aplicado em web/mobile: `docs/transformation/wave-1-guards.md`.
