# Arquitetura Base

## Visao Geral

O projeto foi iniciado como um monorepo com tres aplicacoes principais:

- `apps/web`: interface web em `Next.js`
- `apps/mobile`: app mobile em `React Native` com `Expo`
- `apps/api`: backend em `Django`

Tambem existem areas de suporte:

- `packages/contracts`: contratos compartilhados e convencoes de payload
- `infra/docker`: infraestrutura local com `Docker Compose`
- `docs`: documentacao tecnica

## Fluxo Entre Aplicacoes

- `web` consome a API Django via HTTP.
- `mobile` consome a mesma API via HTTP.
- `api` persiste dados no `PostgreSQL`.
- `docker-compose` sobe os servicos locais para desenvolvimento.

## Decisoes Iniciais

- `Expo` foi adotado para acelerar o bootstrap mobile com React Native.
- O backend usa configuracao por variaveis de ambiente para facilitar execucao local e docker.
- O pacote `packages/contracts` comeca pequeno e documental, para evoluir junto com o produto.
- A base foi mantida neutra, sem regras de negocio, para permitir definir o dominio depois.
