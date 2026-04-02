# Wave 0.1 — Spec técnica de entidades e relacionamentos

Documento de saída da micro-wave 0.1. Alinhado a `docs/domain-map.md` e `docs/api-discovery.md`.

## Identificadores

- Todos os IDs são strings opacas (UUID ou equivalente na API).

## User

- Representa conta de autenticação.
- Relacionamentos: um `StudentProfile` ou um `TeacherProfile` conforme o papel (mutuamente exclusivos na prática).

## StudentProfile / TeacherProfile

- Estendem dados de perfil por papel.
- `StudentProfile.userId` → `User`.
- `TeacherProfile.userId` → `User`.
- Campos de apresentação (nome, foto, bio) convergem no contrato `ProfileResponse` na camada de API/cliente.

## Activity

- Agrega `prova`, `atividade` e `trabalho` via `Activity.kind`.
- Pertence a um professor (`createdBy` / `ownerId` na persistência).
- Contém até 100 questões (regra de produto; não modelada como limite de tipo aqui).
- Nota total em escala 0–100 (`totalScore` nos contratos de lista/detalhe).
- Estados de publicação usam `DomainLifecycleState` (ex.: `draft`, `published`).

## Question / QuestionOption

- `Question` pertence a uma `Activity`.
- `Question.type`: `dissertativa` | `multipla_escolha`.
- `QuestionOption` pertence a questões de múltipla escolha; `isCorrect` é dado sensível (professor/correção).

## Submission

- Envio único do aluno por atividade (regra de negócio).
- `Submission` → `Activity`, `Student` (via `studentId`).
- Estados operacionais: ver `SubmissionStatus` em `@rema/contracts` (pendente, em progresso, enviado, corrigido).

## SubmissionAnswer / SubmissionFile

- `SubmissionAnswer` liga `Submission` a `Question` (texto e/ou opção selecionada).
- `SubmissionFile` para anexos (trabalhos).

## Review

- Retorno formal do professor sobre uma `Submission` (nota + comentário).
- Mapeado ao contrato `ReviewPayload` nas escritas; leitura integrada em `SubmissionDetail` quando aplicável.

## Content

- Material editorial (vídeo, imagem, texto); autoria por professor/admin.
- Estados com `DomainLifecycleState` (`draft`, `published`, `archived`, etc.).

## CalendarEvent / PersonalCalendarNote

- `CalendarEvent`: eventos de domínio (entregas ligadas a atividades ou outros).
- `PersonalCalendarNote`: lembrete privado do aluno (não compartilhado com professores).

## CommunityPost / CommunityApproval / CommunityComment

- `CommunityPost` suporta texto e mídia; visibilidade por audiência (`alunos` | `professores`).
- Fluxo de moderação: estados `pending_review`, `approved`, `rejected` (alinhados a `DomainLifecycleState` e `CommunityModerationStatus`).
- `CommunityApproval` registra decisão do moderador; `CommunityComment` para discussão em post aprovado.

## Game / GameSession

- `Game` é catálogo com ciclo `draft` | `published` | `archived`.
- `GameSession` representa uma execução (aluno + jogo + timestamps); baixo acoplamento ao núcleo acadêmico.

## Diagrama simplificado

```text
User ─┬─ StudentProfile
      └─ TeacherProfile

TeacherProfile ── cria ── Activity ── contém ── Question ── opcional ── QuestionOption

Activity ── recebe ── Submission ── por StudentProfile (1 envio)
Submission ── contém ── SubmissionAnswer, SubmissionFile
Submission ── recebe ── Review (professor)

Content (autor Teacher/User admin)
CalendarEvent (opcional vínculo Activity)
PersonalCalendarNote (Student)

CommunityPost ── CommunityApproval
CommunityPost ── CommunityComment

Game ── GameSession (Student)
```
