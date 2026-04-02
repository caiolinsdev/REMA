# Wave 0: Foundation

## Objetivo

Preparar a base estrutural que todas as waves seguintes vao reutilizar: estados,
entidades, contratos, convencoes de modulo e criterio minimo de integracao.

## Resultado Esperado

- linguagem comum entre `web`, `mobile` e `api`
- estados de dominio padronizados
- contratos iniciais compartilhados
- organizacao tecnica previsivel por modulo

## Entradas

- `docs/product-vision.md`
- `docs/domain-map.md`
- `docs/api-discovery.md`

## Micro-wave 0.1: Entidades Base

### Escopo

Consolidar o recorte conceitual minimo de:

- `User`
- `StudentProfile`
- `TeacherProfile`
- `Activity`
- `Question`
- `QuestionOption`
- `Submission`
- `SubmissionAnswer`
- `SubmissionFile`
- `Review`
- `Content`
- `CalendarEvent`
- `PersonalCalendarNote`
- `CommunityPost`
- `CommunityApproval`
- `CommunityComment`
- `Game`
- `GameSession`

### Decisoes da micro-wave

- `Activity.kind` comeca com `prova`, `atividade`, `trabalho`
- `Question.type` comeca com `dissertativa`, `multipla_escolha`
- `Submission` representa envio unico do aluno
- `Review` representa retorno formal do professor

### Saida

- spec tecnica de entidades e relacionamentos

## Micro-wave 0.2: Contratos Compartilhados

### Escopo

Definir o primeiro conjunto de contratos para `packages/contracts`.

### Contratos prioritarios

- `AuthUser`
- `Role`
- `ActivitySummary`
- `ActivityDetail`
- `QuestionDetail`
- `SubmissionSummary`
- `SubmissionDetail`
- `ReviewPayload`
- `ContentSummary`
- `ContentDetail`
- `CalendarEventSummary`
- `PersonalCalendarNote`
- `CommunityPostSummary`
- `CommunityModerationStatus`
- `GameSummary`
- `ProfileResponse`

### Saida

- spec de payloads e tipos compartilhados

## Micro-wave 0.3: Convencoes de Modulo

### Escopo

Padronizar organizacao por modulo nas tres aplicacoes.

### Estrutura recomendada

```text
apps/web/src/modules/<module>/
apps/mobile/src/modules/<module>/
apps/api/<module>/
packages/contracts/src/<module>/
```

### Convencoes

- `web` e `mobile` organizados por modulo de produto
- `api` organizada por app/modulo de dominio
- contratos separados por contexto funcional
- UI, regras e integracoes desacopladas

## Micro-wave 0.4: Estados do Sistema

### Escopo

Fixar estados reutilizaveis entre modulo academico, comunidade e conteudo.

### Estados iniciais sugeridos

- `draft`
- `published`
- `pending_review`
- `submitted`
- `reviewed`
- `approved`
- `rejected`
- `archived`

### Observacoes

- `pending_review` e importante para posts de aluno
- `submitted` e `reviewed` sao centrais para atividades e trabalhos

## Dependencias

- nenhuma wave anterior

## Critério de Pronto

- entidades nomeadas e consistentes
- contratos iniciais definidos
- convencoes de pasta e modulo aprovadas
- estados comuns documentados

## Riscos

- tentar detalhar schema demais cedo
- acoplar `trabalho` de forma irreversivel ao modelo de `atividade`
- misturar estados de comunidade com estados academicos sem padronizacao

## Implementacao (wave executada)

- **0.1** Spec de entidades: `docs/transformation/wave-0-entity-spec.md`
- **0.2** Contratos TypeScript: `packages/contracts/src/` por contexto (`auth`, `activities`, `contents`, `calendar`, `community`, `games`, `profile`, `common`)
- **0.3** Pastas de modulo: `apps/web/src/modules/*`, `apps/mobile/src/modules/*`, `apps/api/<dominio>/*` (placeholders)
- **0.4** Tipo `DomainLifecycleState` em `packages/contracts/src/common/states.ts`
