# Wave 15 (Fase 2): Mobile — Núcleo acadêmico (tarefas)

## Objetivo

Implementar no mobile o fluxo completo de **tarefas** para aluno e professor,
espelhando a web, **sem** a aba Jogos (esta fica na Fase 4). Inclui listagens,
detalhes, criação/edição/publicação no professor, envio e confirmação no aluno,
lista de envios e tela de correção no professor.

## Resultado Esperado

### Aluno

- lista de tarefas publicadas (`apiActivities`) equivalente a
  [`apps/web/src/app/aluno/atividades/page.tsx`](apps/web/src/app/aluno/atividades/page.tsx)
- detalhe da tarefa + rascunho de envio + confirmação (`apiActivityDetail`,
  `apiCurrentSubmission`, `apiSaveSubmission`, `apiConfirmSubmission`) equivalente a
  [`apps/web/src/app/aluno/atividades/[id]/page.tsx`](apps/web/src/app/aluno/atividades/[id]/page.tsx)
- rótulos de UI via mesma semântica da web (reutilizar ou copiar helpers de
  [`apps/web/src/modules/activities/ui.ts`](apps/web/src/modules/activities/ui.ts))

### Professor

- lista de tarefas (`apiActivities`) como
  [`apps/web/src/app/professor/atividades/page.tsx`](apps/web/src/app/professor/atividades/page.tsx)
- criar nova tarefa (`apiCreateActivity`) como
  [`apps/web/src/app/professor/atividades/novo/page.tsx`](apps/web/src/app/professor/atividades/novo/page.tsx)
- editar tarefa (`apiUpdateActivity`) como
  [`apps/web/src/app/professor/atividades/[id]/editar/page.tsx`](apps/web/src/app/professor/atividades/[id]/editar/page.tsx)
- detalhe da tarefa + publicação (`apiPublishActivity`) como
  [`apps/web/src/app/professor/atividades/[id]/page.tsx`](apps/web/src/app/professor/atividades/[id]/page.tsx)
- lista de envios (`apiActivitySubmissions`) e navegação para detalhe do envio
- correção (`apiReviewSubmission` + `apiSubmissionDetail`) como
  [`apps/web/src/app/professor/atividades/[id]/envios/[submissionId]/page.tsx`](apps/web/src/app/professor/atividades/[id]/envios/[submissionId]/page.tsx)

### Fora de escopo nesta fase

- upload de arquivo em envio tipo trabalho (se a web usar arquivo, preparar UI
  mínima ou documentar dependência da Fase 3 com `expo-document-picker`)
- imagens de apoio em questões (`apiUploadMedia` + `MediaImage`) — **Fase 3**,
  exceto se bloquear teste; nesse caso, stub com texto “Anexo na Fase 3”

## Entradas

- [`apps/web/src/modules/activities/ActivityEditor.tsx`](apps/web/src/modules/activities/ActivityEditor.tsx)
- [`apps/web/src/modules/activities/ui.ts`](apps/web/src/modules/activities/ui.ts)
- [`apps/web/src/lib/api.ts`](apps/web/src/lib/api.ts) (seção atividades / envios)
- [`packages/contracts`](packages/contracts) (tipos de atividade, envio, review)

## Diretriz Geral

- respeitar bloqueios de estado: aluno não edita após `submitted` / `reviewed`
- tratar 404 em `apiCurrentSubmission` como “sem rascunho ainda”
- professor: fluxo de publicação explícito como na web
- validações de erro da API: exibir `message` retornada pelo backend

## Micro-wave 15.1: Stacks e rotas de tarefas

### Escopo

Registrar no stack do aluno: `AtividadesList`, `AtividadeDetail`.

Registrar no stack do professor: `AtividadesList`, `AtividadeNova`, `AtividadeEditar`,
`AtividadeDetail`, `EnviosList`, `EnvioDetail` (ou nomes equivalentes).

### Regras

- passar `activityId` / `submissionId` por params de navegação
- header com título coerente (nome da tarefa quando carregado)

## Micro-wave 15.2: Aluno — lista e detalhe

### Escopo

Implementar lista e detalhe com questões (texto, múltipla escolha conforme
contrato), navegação entre questões, resumo de preenchimento, salvar rascunho e
confirmar envio.

### Regras

- para `kind === "trabalho"`: se anexo for obrigatório na web, alinhar na Fase 3;
  até lá, mensagem clara se o fluxo depender de arquivo

## Micro-wave 15.3: Professor — CRUD e publicação

### Escopo

Formulários para criar/editar tarefa espelhando campos essenciais do
`ActivityEditor` web (título, tipo, datas, questões, pontuação).

### Regras

- não simplificar regras de negócio que a API valida (mensagens de erro ao usuário)
- botão publicar separado de salvar, se for o caso na web

## Micro-wave 15.4: Professor — envios e correção

### Escopo

Lista de envios por atividade; tela de detalhe com notas / feedback e ação de
correção alinhada ao payload `ReviewPayload`.

## Critérios de Aceite

- fluxo feliz aluno: abrir tarefa, responder, salvar, confirmar
- fluxo feliz professor: criar rascunho, editar, publicar, abrir envio, corrigir
- erros de API visíveis na UI (não apenas console)
- sem regressão na Fase 1 (home e auth)

## Dependência

- conclusão da [Wave 14 — Fundação](wave-14-mobile-fase-1-fundacao.md)

## Próxima fase

- [`wave-16-mobile-fase-3-conteudos-calendario-perfil.md`](wave-16-mobile-fase-3-conteudos-calendario-perfil.md)
