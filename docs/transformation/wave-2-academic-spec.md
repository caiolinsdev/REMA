# Wave 2.1-2.6 — Academic core implementado

Saida consolidada da Wave 2 em codigo.

## Modelo

- `Activity`: entidade central para `prova`, `atividade` e `trabalho`
- `Question`: questoes ordenadas por `position`
- `QuestionOption`: opcoes de multipla escolha
- estado inicial controlado por `ActivityStatus`: `draft`, `published`, `closed`, `archived`

## Regras protegidas na API

- `total_score` deve ser sempre `100`
- `prova` e `atividade` aceitam no maximo `100` questoes
- soma dos pesos das questoes precisa fechar em `100` para publicar
- questao `multipla_escolha` precisa de ao menos `2` e no maximo `5` opcoes
- questao `dissertativa` nao aceita opcoes
- `trabalho` exige descricao e, nesta primeira versao, nao aceita questoes
- apenas professor pode criar, editar ou publicar
- apenas itens em `draft` podem ser editados/publicados

## Endpoints entregues

- `GET /api/activities/`
- `POST /api/activities/`
- `GET /api/activities/{id}/`
- `PATCH /api/activities/{id}/`
- `POST /api/activities/{id}/publish/`
- `POST /api/activities/{id}/questions/`
- `PATCH /api/questions/{id}/`

## Leitura por papel

- professor lista apenas atividades criadas por ele
- professor ve detalhe completo, incluindo `expectedAnswer`, `isCorrect` e resumo de validacao
- aluno lista apenas atividades `published` ou `closed`
- aluno ve detalhe sem gabarito, sem flags de resposta correta e sem dados de validacao interna

## Web entregue

- professor:
  - lista em `/professor/atividades`
  - criacao em `/professor/atividades/novo`
  - detalhe em `/professor/atividades/[id]`
  - edicao de `draft` em `/professor/atividades/[id]/editar`
- aluno:
  - lista em `/aluno/atividades`
  - detalhe em `/aluno/atividades/[id]`

## Contratos

- `packages/contracts/src/activities/types.ts` agora inclui:
  - `ActivityStatus`
  - `QuestionInput`
  - `UpsertActivityRequest`
  - `ActivityValidationSummary`
