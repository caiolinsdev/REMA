# Wave 17 (Fase 4): Mobile — Comunidade, jogos e polish de UX

## Objetivo

Fechar a paridade com a web nos módulos **Comunidade** (aluno e professor) e
**Jogos** (somente aluno), e aplicar **polish de UX** em todo o app: loading,
erros, gestos e consistência visual entre telas implementadas nas fases 1–3.

## Resultado Esperado

### Comunidade — Aluno

- feed (`apiCommunityPosts`) e criação de post com mídia opcional (`apiUploadMedia`
  para imagem/vídeo/gif conforme web) equivalente a
  [`apps/web/src/app/aluno/comunidade/page.tsx`](apps/web/src/app/aluno/comunidade/page.tsx)
- exibir posts com texto e mídia; tratar estados vazio/erro/carregando

### Comunidade — Professor

- feed privado / moderação como
  [`apps/web/src/app/professor/comunidade/page.tsx`](apps/web/src/app/professor/comunidade/page.tsx)
- ações `apiCommunityPostDetail`, `apiApproveCommunityPost`, `apiRejectCommunityPost`
  quando aplicável na web

### Jogos — Aluno

- catálogo (`apiGames`), detalhe (`apiGameDetail`), runtime (`apiGameRuntime`),
  registro de sessão (`apiRegisterGameSession`) e histórico se usado na web
- portar a lógica de jogo dos componentes em
  [`apps/web/src/app/aluno/jogos/page.tsx`](apps/web/src/app/aluno/jogos/page.tsx)
  (forca, sudoku, quizzes, labirinto) para componentes React Native
- estados de **loading** alinhados à intenção da
  [Wave 13](wave-13-student-games-loading.md): carregamento inicial do catálogo,
  troca de jogo sem “congelar” o anterior, empty real vs loading

### Polish global

- **Loading**: spinners ou skeletons leves nas listas longas; evitar telas em
  branco sem feedback
- **Erros**: mensagens em português; onde a web usa `status`, tratar 401 como
  sessão expirada (logout ou redirect ao login)
- **Gestos**: drawer e stacks com gestos nativos já fornecidos pelo React
  Navigation; revisar `back` em fluxos profundos (correção, editor)
- **Consistência**: usar tema da Fase 1 em todas as telas novas; revisar padding
  e headers duplicados

## Entradas

- [`apps/web/src/app/aluno/comunidade/page.tsx`](apps/web/src/app/aluno/comunidade/page.tsx)
- [`apps/web/src/app/professor/comunidade/page.tsx`](apps/web/src/app/professor/comunidade/page.tsx)
- [`apps/web/src/app/aluno/jogos/page.tsx`](apps/web/src/app/aluno/jogos/page.tsx)
- [`apps/web/src/app/aluno/jogos/page.module.css`](apps/web/src/app/aluno/jogos/page.module.css) (referência visual; reimplementar em RN)
- [`docs/transformation/wave-13-student-games-loading.md`](docs/transformation/wave-13-student-games-loading.md)
- [`packages/contracts/src/games/types.ts`](packages/contracts/src/games/types.ts)

## Diretriz Geral

- jogos: preferir UI nativa (`Pressable`, `Animated` leve) em vez de WebView,
  salvo bloqueio técnico documentado
- comunidade: respeitar fluxo de aprovação (aluno vê apenas o permitido pela API)
- não introduzir bibliotecas pesadas só para animação; reutilizar padrões já
  aceitos no monorepo (`react-native-reanimated` já presente)

## Micro-wave 17.1: Comunidade aluno

### Escopo

Lista infinita ou scroll simples; composer com anexos; preview antes de enviar.

## Micro-wave 17.2: Comunidade professor

### Escopo

Lista de pendentes / ações de moderação; detalhe do post se necessário.

## Micro-wave 17.3: Jogos aluno

### Escopo

Lista de jogos; painel principal; componentes por `gameKey`; botão “nova partida”
chamando runtime de novo; registrar sessão ao concluir como na web.

## Micro-wave 17.4: Polish transversal

### Escopo

Passada em todas as telas das fases 1–3: loading/error/empty, labels de
acessibilidade básicos, revisão de cores e espaçamentos.

### Checklist sugerido

- auth: erro de rede com URL em dev
- home: refresh ou re-fetch ao focar tela (opcional, documentar)
- tarefas/conteúdos/calendário/perfil: mensagens consistentes
- jogos: nunca mostrar “nenhum jogo” durante fetch inicial

## Critérios de Aceite

- aluno acessa **Jogos** no drawer e joga os cinco jogos curados com dados da API
- professor modera comunidade como na web
- comunidade aluno cria post com mídia opcional com sucesso
- UX: não há regressões óbvias de navegação (voltar, drawer, logout)
- app pronto para teste E2E manual do fluxo completo aluno e professor

## Dependência

- [Wave 16 — Conteúdos, calendário, perfil e uploads](wave-16-mobile-fase-3-conteudos-calendario-perfil.md)

## Encerramento da série mobile

Após a Wave 17, revisar paridade com a web usando a matriz definida no plano de
paridade mobile; abrir issues para lacunas pontuais (se houver).
