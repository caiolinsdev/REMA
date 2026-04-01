# Wave 3: Submission and Review

## Objetivo

Transformar o item acadêmico publicado em fluxo completo de realização, envio,
correção e consulta de resultado.

## Resultado Esperado

- aluno responde ou anexa trabalho
- aluno confirma envio unico
- professor corrige
- aluno consulta nota e retorno

## Entradas

- `docs/user-flows.md`
- `docs/domain-map.md`
- `docs/api-discovery.md`
- `docs/transformation/wave-2-academic-core.md`

## Micro-wave 3.1: Answering Flow

### Escopo

Especificar o preenchimento de `provas` e `atividades`.

### Casos cobertos

- resposta dissertativa
- resposta de multipla escolha
- navegacao entre questoes
- estados antes do envio

## Micro-wave 3.2: Work Upload Flow

### Escopo

Especificar envio de `trabalho`.

### Regras

- aceitar `pdf`, `doc`, `docx`, `txt`
- um arquivo por envio inicial
- vincular o anexo ao `Submission`

## Micro-wave 3.3: Confirmacao de Envio

### Escopo

Definir o comportamento obrigatorio antes do envio final.

### Regras

- exibicao de modal ou etapa de confirmacao
- alerta de que nao sera possivel editar depois

## Micro-wave 3.4: Envio Unico

### Escopo

Padronizar as regras de imutabilidade do envio.

### Regras

- aluno envia apenas uma vez
- nao pode editar apos envio
- nao pode reenviar
- o sistema registra `submitted_at`

## Micro-wave 3.5: Correcao do Professor

### Escopo

Planejar a visao do professor para revisar envios.

### Capacidades

- ver respostas do aluno
- ver anexo do trabalho
- registrar nota
- registrar comentario

## Micro-wave 3.6: Regra Especifica de Trabalho

### Escopo

Documentar a obrigatoriedade de comentario do professor.

### Regra

- `Review.comment` e obrigatorio em `trabalho`

## Micro-wave 3.7: Consulta de Resultado

### Escopo

Planejar a experiencia do aluno apos avaliacao.

### Diretriz

- reaproveitar, se possivel, a tela de realizacao para mostrar:
  - status
  - nota
  - retorno

## Fluxo Base

```mermaid
flowchart LR
  aluno[Aluno] --> answerItem[ResponderOuAnexar]
  answerItem --> confirmSubmit[ConfirmarEnvio]
  confirmSubmit --> finalSubmit[Submeter]
  finalSubmit --> teacherReview[ProfessorRevisa]
  teacherReview --> reviewedState[SubmissionReviewed]
  reviewedState --> studentResult[AlunoConsultaResultado]
```

## Dependencias

- depende de `Wave 2`

## Critério de Pronto

- fluxo de submissao unica definido
- correcao do professor especificada
- regra de `trabalho` com comentario obrigatorio documentada
- experiencia de resultado do aluno clara

## Riscos

- diferencas grandes entre `prova`, `atividade` e `trabalho` gerarem UX
  inconsistente
- confirmar envio de forma fraca e aumentar erro de utilizador
- tela de consulta de nota nao refletir bem o historico do envio
