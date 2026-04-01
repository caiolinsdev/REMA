# REMA

Base inicial de um monorepo para um produto com:

- `Next.js` para a aplicacao web
- `React Native` com `Expo` para o app mobile
- `Django` para a API
- `PostgreSQL` para persistencia
- `Docker Compose` para infraestrutura local

## Estrutura

```text
apps/
  api/       API Django
  mobile/    App React Native + Expo
  web/       App Next.js
docs/        Documentacao tecnica e setup
infra/       Docker e infraestrutura local
packages/    Artefatos compartilhados
```

## Primeiros passos

1. Copie `.env.example` para `.env` na raiz e ajuste se necessario.
2. Copie `apps/api/.env.example` para `apps/api/.env`.
3. Suba banco e API com `npm run docker:up`.
4. Rode a web com `npm run dev:web`.
5. Rode o mobile com `npm run dev:mobile`.

## Scripts uteis

- `npm run dev:web`
- `npm run dev:mobile`
- `npm run dev:api`
- `npm run docker:up`
- `npm run docker:down`
- `npm run lint`

Mais detalhes em `docs/setup.md` e `docs/architecture.md`.
