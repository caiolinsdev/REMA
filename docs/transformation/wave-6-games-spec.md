# Wave 6.1-6.4 — Games implementado

Saida consolidada da Wave 6 em codigo.

## Estrategia tecnica

- jogos independentes do nucleo academico nesta fase
- experiencia entregue sem dependencia de biblioteca externa
- progresso salvo por sessao no backend

## Catalogo

- `Game` passou a sustentar:
  - `slug`
  - `title`
  - `description`
  - `instructions`
  - `experience_type`
  - `estimated_minutes`
  - `status`
- catalogo inicial seeded com `5` jogos publicados:
  - `Quiz de Fracoes`
  - `Memoria de Ciencias`
  - `Sequencia Historica`
  - `Palavras da Geografia`
  - `Logica dos Padroes`

## Progresso

- `GameSession` registra:
  - `student`
  - `game`
  - `score`
  - `progress`
  - `played_at`
- regras:
  - somente aluno acessa jogos nesta fase
  - `score` deve ficar entre `0` e `100`
  - `progress` deve ficar entre `0` e `100`

## Endpoints entregues

- `GET /api/games/`
- `GET /api/games/{id}/`
- `POST /api/games/{id}/sessions/`
- `GET /api/games/sessions/`

## Web entregue

- `apps/web/src/app/aluno/jogos/page.tsx`

Capacidades:

- listar catalogo de jogos
- abrir detalhe com instrucoes
- registrar sessao simulada com score e progresso
- consultar historico proprio por jogo

## Testes adicionados

- listagem de jogos publicados para aluno
- bloqueio de acesso para professor
- registro de sessao
- detalhe de jogo com melhor score e progresso do aluno
