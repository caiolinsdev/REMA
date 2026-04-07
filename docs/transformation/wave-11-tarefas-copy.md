# Wave 11: Tarefas e Revisão Editorial

## Objetivo

Unificar a linguagem de produto para `tarefas` em toda a experiência do usuário,
sem alterar os valores internos `prova`, `atividade` e `trabalho` no backend, e
executar uma revisão editorial ampla dos textos nativos para corrigir
acentuação, ortografia e consistência de PT-BR.

## Resultado Esperado

- navegação e telas passam a falar em `tarefas`, não em `provas / atividades /
  trabalhos`
- os valores internos atuais continuam existindo apenas como detalhe técnico
- textos nativos do web e mobile ficam revisados em PT-BR
- mensagens nativas da API expostas ao usuário ficam revisadas
- documentação funcional e de produto fica alinhada ao novo vocabulário

## Entradas

- `docs/product-vision.md`
- `docs/user-flows.md`
- `docs/modules/aluno.md`
- `docs/modules/professor.md`
- `apps/web/src/modules/activities/ActivityEditor.tsx`
- `apps/web/src/app/aluno/layout.tsx`
- `apps/web/src/app/professor/layout.tsx`
- `apps/mobile/src/navigation/MainDrawer.tsx`

## Micro-wave 11.1: Vocabulário de Produto

### Escopo

Substituir a linguagem visível de `provas / atividades / trabalhos` por
`tarefas` nas áreas de navegação, listagem, detalhe, formulários e calendário.

### Regra Base

- a UI nunca deve expor diretamente `prova`, `atividade` ou `trabalho` como
  categoria principal
- os três valores continuam existindo apenas como detalhe técnico interno
- quando necessário, a UI descreve diferenças por comportamento de entrega, não
  por `kind`

### Arquivos Prioritários

- `apps/web/src/app/aluno/layout.tsx`
- `apps/web/src/app/professor/layout.tsx`
- `apps/web/src/app/aluno/atividades/page.tsx`
- `apps/web/src/app/professor/atividades/page.tsx`
- `apps/web/src/app/aluno/atividades/[id]/page.tsx`
- `apps/web/src/app/professor/atividades/[id]/page.tsx`
- `apps/web/src/app/professor/atividades/[id]/envios/[submissionId]/page.tsx`
- `apps/mobile/src/navigation/MainDrawer.tsx`

## Micro-wave 11.2: UI de Tarefas sem quebrar o domínio

### Escopo

Revisar componentes que hoje usam `activity.kind` para decidir rótulos e
explicações, mantendo a lógica existente, mas escondendo a taxonomia técnica do
usuário.

### Regras

- manter compatibilidade com `ActivityKind` nos contratos atuais
- preservar regras de entrega e revisão já existentes
- substituir textos explicativos baseados em `kind` por descrições orientadas a
  ação do usuário

### Áreas de impacto

- `apps/web/src/modules/activities/ActivityEditor.tsx`
- `packages/contracts/src/activities/types.ts`
- `apps/api/core/activities_views.py`
- `apps/api/core/activities_payload.py`
- `apps/api/core/submissions_views.py`
- `apps/api/core/calendar_views.py`

## Micro-wave 11.3: Revisão Editorial do Web e Mobile

### Escopo

Fazer uma passada editorial sistemática nos textos nativos do produto,
corrigindo acentuação, ortografia e consistência terminológica.

### Correções-alvo

- `conteudo` -> `conteúdo`
- `Conteudos` -> `Conteúdos`
- `Calendario` -> `Calendário`
- `Descricao` -> `Descrição`
- `Video` -> `Vídeo`
- `Nao` -> `Não`
- `Voce` -> `Você`
- `sessao` -> `sessão`
- `questao` -> `questão`
- `Portugues` -> `Português`
- `Matematica` -> `Matemática`
- `academico` -> `acadêmico`

### Arquivos Prioritários

- `apps/web/src/app/aluno/jogos/page.tsx`
- `apps/web/src/modules/contents/ContentEditor.tsx`
- `apps/web/src/app/aluno/calendario/page.tsx`
- `apps/web/src/app/professor/calendario/page.tsx`
- `apps/web/src/components/AppShell.tsx`
- `apps/mobile/src/navigation/MainDrawer.tsx`
- `apps/mobile/src/screens/LoginScreen.tsx`
- `apps/mobile/src/lib/api.ts`

## Micro-wave 11.4: Mensagens nativas da API

### Escopo

Revisar mensagens de erro e sucesso que saem do backend e aparecem diretamente
no front, sem alterar contratos técnicos além do texto exibido.

### Arquivos Prioritários

- `apps/api/core/auth_views.py`
- `apps/api/core/activities_views.py`
- `apps/api/core/activities_payload.py`
- `apps/api/core/submissions_views.py`
- `apps/api/core/calendar_views.py`
- `apps/api/core/community_views.py`
- `apps/api/core/content_views.py`
- `apps/api/core/profile_views.py`
- `apps/api/core/games_views.py`

## Micro-wave 11.5: Documentação alinhada

### Escopo

Atualizar a documentação funcional e de produto para refletir `tarefas` como
linguagem oficial de produto, mantendo notas técnicas apenas onde necessário.

### Arquivos Prioritários

- `docs/product-vision.md`
- `docs/user-flows.md`
- `docs/modules/aluno.md`
- `docs/modules/professor.md`
- `docs/domain-map.md`
- `docs/api-discovery.md`
- waves anteriores que descrevem explicitamente `prova`, `atividade` e
  `trabalho`

## Estratégia de Execução

1. mapear labels e mensagens expostas diretamente ao usuário
2. trocar navegação e títulos principais para `tarefas`
3. revisar telas de detalhe e formulários mantendo a lógica interna atual
4. aplicar revisão editorial sistemática no web e mobile
5. revisar mensagens nativas da API
6. alinhar documentação funcional e de produto

## Critério de Pronto

- o produto passa a falar em `tarefas` nas áreas principais
- não há regressão de regras internas ligadas a `ActivityKind`
- textos nativos revisados em PT-BR ficam consistentes entre web, mobile e API
- documentação principal fica alinhada ao novo vocabulário

## Riscos

- expor `kind` cru em algum ponto residual da UI
- trocar texto visível sem revisar mensagens vindas do backend
- corrigir copy manualmente sem padronização e deixar inconsistências entre
  áreas
- confundir linguagem de produto com refatoração completa de domínio,
  aumentando escopo sem necessidade
