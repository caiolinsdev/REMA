# Wave 4.1-4.6 — Content and calendar implementado

Saida consolidada da Wave 4 em codigo.

## Conteudos

- `Content` com:
  - `title`
  - `subtitle`
  - `description`
  - `status`
  - `author`
  - `published_at`
  - `image_url`
  - `video_url`
- professor:
  - cria em `draft`
  - edita
  - publica
  - arquiva
  - exclui
- aluno:
  - lista apenas conteudos `published`
  - abre detalhe com preview de midia

## Calendario

- `CalendarEvent` para eventos manuais/globais
- `PersonalCalendarNote` para anotacoes individuais do aluno
- eventos academicos automaticos derivados de `Activity.due_at`
  - `delivery_prova`
  - `delivery_atividade`
  - `delivery_trabalho`

## Regras

- notas pessoais sao exclusivas do proprio aluno
- notas pessoais nao aparecem para professor
- eventos automáticos do calendário nao exigem persistência extra; sao derivados do dominio academico no `GET /api/calendar/events/`

## Endpoints entregues

- `GET /api/contents/`
- `POST /api/contents/`
- `GET /api/contents/{id}/`
- `PATCH /api/contents/{id}/`
- `DELETE /api/contents/{id}/`
- `GET /api/calendar/events/`
- `POST /api/calendar/events/`
- `PATCH /api/calendar/events/{id}/`
- `GET /api/calendar/notes/`
- `POST /api/calendar/notes/`
- `PATCH /api/calendar/notes/{id}/`

## Web entregue

- professor:
  - `apps/web/src/app/professor/conteudos`
  - `apps/web/src/app/professor/conteudos/novo`
  - `apps/web/src/app/professor/conteudos/[id]`
  - `apps/web/src/app/professor/conteudos/[id]/editar`
  - `apps/web/src/app/professor/calendario`
- aluno:
  - `apps/web/src/app/aluno/conteudos`
  - `apps/web/src/app/aluno/conteudos/[id]`
  - `apps/web/src/app/aluno/calendario`

## Estrategia tecnica

- nesta fase, o `web` usa uma experiencia de lista/cartoes para calendario em vez de biblioteca visual dedicada
- isso reduz acoplamento e mantem o foco nas regras de dominio e integracao com o backend
