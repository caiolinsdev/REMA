# Wave 3.1-3.7 — Submission and review implementado

Saida consolidada da Wave 3 em codigo.

## Fluxo do aluno

- `prova` e `atividade`
  - preencher respostas dissertativas ou de multipla escolha
  - navegar entre questoes
  - salvar em andamento (`in_progress`)
  - confirmar envio unico
- `trabalho`
  - anexar um unico arquivo
  - tipos permitidos: `pdf`, `doc`, `docx`, `txt`
  - salvar em andamento
  - confirmar envio unico

## Regras protegidas

- existe apenas uma `Submission` por aluno por atividade
- apos `submitted`, o aluno nao pode editar nem reenviar
- `submitted_at` e registado na confirmacao
- `Review.comment` e obrigatorio para `trabalho`
- apenas professor dono da atividade pode revisar

## Endpoints entregues

- `GET /api/activities/{id}/submissions/` — lista de envios do professor
- `POST /api/activities/{id}/submissions/` — salvar rascunho do aluno
- `GET /api/activities/{id}/submissions/current/` — envio atual do aluno
- `GET /api/submissions/{id}/` — detalhe de envio
- `POST /api/submissions/{id}/confirm/` — confirmacao final
- `POST /api/submissions/{id}/review/` — correcao do professor

## Web entregue

- aluno: `apps/web/src/app/aluno/atividades/[id]/page.tsx`
  - tela de realizacao
  - confirmacao antes do envio final
  - consulta de status, nota e retorno na mesma tela
- professor:
  - lista de envios dentro do detalhe da atividade
  - detalhe/correcao em `apps/web/src/app/professor/atividades/[id]/envios/[submissionId]/page.tsx`

## Observacao tecnica

- o anexo de `trabalho` usa leitura local no browser e envia os dados para a API nesta fase inicial, sem infraestrutura dedicada de storage.
