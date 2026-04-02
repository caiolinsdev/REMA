# Wave 5.1-5.6 — Profile and community implementado

Saida consolidada da Wave 5 em codigo.

## Perfil

- `UserProfile` passou a sustentar:
  - `display_name`
  - `avatar_url`
  - `bio`
  - `preferences`
- leitura e edicao do perfil atual via:
  - `GET /api/profile/`
  - `PATCH /api/profile/`
  - `POST /api/profile/avatar/`
- regras:
  - `display_name` e obrigatorio na atualizacao
  - `preferences` precisa ser objeto JSON
  - `bio` continua opcional, com foco em professor

## Comunidade

- `CommunityPost` define o feed segmentado por `audience`
- `CommunityApproval` registra a decisao do professor
- `CommunityComment` fica preparada no dominio para a proxima fase

### Regras entregues

- aluno:
  - cria post apenas para `alunos`
  - post nasce em `pending_review`
  - feed do aluno lista apenas posts `approved`
  - aluno pode consultar os proprios posts via `GET /api/community/posts/?scope=mine`
- professor:
  - cria post apenas para `professores`
  - post entra direto como `approved`
  - acessa feed privado de professores
  - acessa fila de moderacao dos posts de alunos
- moderacao:
  - `POST /api/community/posts/{id}/approve/`
  - `POST /api/community/posts/{id}/reject/`
  - cada decisao cria um registro em `CommunityApproval`

## Endpoints entregues

- `GET /api/profile/`
- `PATCH /api/profile/`
- `POST /api/profile/avatar/`
- `GET /api/community/posts/`
- `POST /api/community/posts/`
- `GET /api/community/posts/{id}/`
- `POST /api/community/posts/{id}/approve/`
- `POST /api/community/posts/{id}/reject/`

## Web entregue

- aluno:
  - `apps/web/src/app/aluno/perfil/page.tsx`
  - `apps/web/src/app/aluno/comunidade/page.tsx`
- professor:
  - `apps/web/src/app/professor/perfil/page.tsx`
  - `apps/web/src/app/professor/comunidade/page.tsx`

## Testes adicionados

- atualizacao de perfil
- post de aluno ficando invisivel ate aprovacao
- feed privado de professores
- rejeicao de post por professor
