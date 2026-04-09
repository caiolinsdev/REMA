# Wave 14 (Fase 1): Mobile — Fundação

## Objetivo

Estabelecer a base técnica e visual do app Expo para que as fases seguintes
implementem paridade com a web sem refatorações estruturais grandes: tema
reutilizável, cliente HTTP completo (espelhando a web), navegação drawer + stacks
por papel, e homes de aluno e professor em modo **somente leitura** (dados
reais via API, sem formulários de criação nesta fase).

## Resultado Esperado

- existe um pequeno **design system** mobile (cores, tipografia base, espaçamentos)
  alinhado à identidade já usada na web e no login atual (`#0f172a`, `#2563eb`,
  `#f8fafc`, `#64748b`, etc.)
- [`apps/mobile/src/lib/api.ts`](apps/mobile/src/lib/api.ts) expõe as mesmas
  operações que [`apps/web/src/lib/api.ts`](apps/web/src/lib/api.ts) (funções
  exportadas), com `getApiBase` / `getApiOrigin` equivalentes e tratamento de
  erro JSON consistente
- o **drawer** lista apenas as rotas pertinentes a cada papel (espelho de
  [`apps/web/src/app/aluno/layout.tsx`](apps/web/src/app/aluno/layout.tsx) e
  [`apps/web/src/app/professor/layout.tsx`](apps/web/src/app/professor/layout.tsx);
  professor **sem** item Jogos)
- cada item principal do drawer abre um **Native Stack** com telas nomeadas
  preparadas para deep links futuros (lista de placeholders substituíveis nas
  fases 2–4)
- **Home aluno**: consome `GET /home/student-summary/` e renderiza blocos
  equivalentes a [`apps/web/src/app/aluno/page.tsx`](apps/web/src/app/aluno/page.tsx)
  (posts recentes, próximos compromissos), sem edição
- **Home professor**: consome `GET /home/teacher-summary/` e renderiza blocos
  equivalentes a [`apps/web/src/app/professor/page.tsx`](apps/web/src/app/professor/page.tsx)
  (conteúdos recentes, pendências de correção), sem ações de correção nesta fase
- telas ainda não implementadas nas fases 2–4 podem mostrar um **stub** curto
  (“Implementado na Fase X”) em vez do texto antigo “Wave Y”

## Entradas

- [`apps/mobile/App.tsx`](apps/mobile/App.tsx)
- [`apps/mobile/src/context/AuthContext.tsx`](apps/mobile/src/context/AuthContext.tsx)
- [`apps/mobile/src/navigation/MainDrawer.tsx`](apps/mobile/src/navigation/MainDrawer.tsx)
- [`apps/mobile/src/navigation/RootNavigator.tsx`](apps/mobile/src/navigation/RootNavigator.tsx)
- [`apps/web/src/lib/api.ts`](apps/web/src/lib/api.ts)
- [`packages/contracts`](packages/contracts)
- [`docs/setup.md`](docs/setup.md) (variáveis `EXPO_PUBLIC_API_URL`, Docker)

## Diretriz Geral

- não alterar contratos de API nem comportamento do backend nesta fase
- preferir **uma** camada `authorizedRequest` + `parseJson` + mensagens de erro
  como na web
- `apiUploadMedia` pode existir no cliente nesta fase com assinatura preparada
  para React Native (`FormData` com URI), mesmo que nenhuma tela chame ainda
- manter `__DEV__` logs úteis para falhas de rede (já iniciado no mobile)

## Micro-wave 14.1: Tema e componentes base

### Escopo

Criar `theme` (ex.: [`apps/mobile/src/theme.ts`](apps/mobile/src/theme.ts)) e
componentes mínimos: `Screen`, `PrimaryButton`, `BodyText`, `Title`, `ErrorBanner`,
`LoadingCenter`.

### Regras

- cores e pesos de fonte coerentes com o login e com a web
- `Screen` aplica fundo, padding e `SafeAreaView` onde necessário

## Micro-wave 14.2: Cliente API completo

### Escopo

Portar todas as funções exportadas de
[`apps/web/src/lib/api.ts`](apps/web/src/lib/api.ts) para o mobile, incluindo
tipos `MediaUploadKind` e `apiUploadMedia` (implementação RN).

### Regras

- base URL: `EXPO_PUBLIC_API_URL` com fallback `10.0.2.2` (Android) / `localhost` (iOS simulador)
- `getApiOrigin` para montar URLs absolutas de mídia quando o payload vier relativo
- erros HTTP: extrair `message` do JSON quando existir

### Nota opcional

Se a duplicação incomodar, documentar no PR a possibilidade futura de extrair
`packages/api-client`; esta fase pode manter duplicação explícita para velocidade.

## Micro-wave 14.3: Navegação drawer + stacks

### Escopo

Refatorar [`MainDrawer.tsx`](apps/mobile/src/navigation/MainDrawer.tsx) para que
cada seção (Home, Tarefas, Conteúdos, …) seja um **navigator em stack** com pelo
menos uma tela inicial; telas de detalhe serão empilhadas nas fases 2–4.

### Estrutura sugerida

- `AlunoRoot`: drawer → `AlunoHomeStack`, `AlunoTarefasStack`, …
- `ProfessorRoot`: idem sem `Jogos`
- item “Sair” no drawer custom content (como hoje)

### Regras

- títulos do drawer iguais aos labels da web (Tarefas, Conteúdos, Calendário, …)
- `headerStyle` / `headerTintColor` alinhados ao tema

## Micro-wave 14.4: Homes read-only

### Escopo

- Tela **Aluno Home**: `apiStudentHomeSummary`, estados loading / error / empty,
  listas truncadas como na web (3 + 3)
- Tela **Professor Home**: `apiTeacherHomeSummary`, idem

### Regras

- formatação de datas em `pt-BR` como na web
- toques em itens podem ser **no-op** ou navegar para stack vazio com mensagem
  “Fase 2+” até a fase correspondente existir

## Critérios de Aceite

- build do Expo sem erros de TypeScript relacionados ao cliente API
- login → drawer → home mostra dados reais da API para ambos os papéis
- nenhuma dependência nova obrigatória além das já usadas para navegação (Fase 3
  adiciona picker / vídeo)
- documentar no PR se algo da web foi deliberadamente postergado (deve ser zero
  para o escopo desta fase)

## Dependência

- onda independente do backend; requer API com endpoints de home já disponíveis
  (Waves 12+ na API)

## Próxima fase

- [`wave-15-mobile-fase-2-nucleo-academico.md`](wave-15-mobile-fase-2-nucleo-academico.md)
