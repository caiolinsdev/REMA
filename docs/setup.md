# Setup Local

## Requisitos

- `Node.js` e `npm`
- `Python 3`
- `Docker` com `Docker Compose`

## Variaveis de Ambiente

1. Copie a raiz:

```bash
cp .env.example .env
```

2. Copie a API:

```bash
cp apps/api/.env.example apps/api/.env
```

## Subindo com Docker

```bash
npm run docker:up
```

Isso sobe:

- `postgres`
- `api`

API esperada em `http://localhost:8000/api/health/`.

## Rodando a Web

```bash
npm run dev:web
```

Web esperada em `http://localhost:3000`.

## Rodando o Mobile

```bash
npm run dev:mobile
```

O Expo exibira as opcoes para abrir no simulador ou no app Expo Go.

## Rodando a API sem Docker

```bash
./apps/api/.venv/bin/python ./apps/api/manage.py migrate
npm run dev:api
```

## Observacoes

- A API esta preparada para `PostgreSQL` via `DATABASE_URL`.
- O healthcheck inicial pode ser usado para validar rede e integracao entre os apps.
- O pacote `packages/contracts` ainda e inicial, mas ja centraliza contratos base de API.
