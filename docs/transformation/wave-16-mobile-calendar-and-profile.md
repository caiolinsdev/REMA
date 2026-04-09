# Wave 16 (Fase 3): Mobile — Conteúdos, calendário, perfil e uploads

## Objetivo

Completar no mobile os módulos de **conteúdos**, **calendário** e **perfil**, com
**upload de mídia** funcional (avatar, imagens/vídeos de conteúdo, imagens de
apoio em tarefas e comunidade quando aplicável), alinhados às páginas web e ao
endpoint `POST /api/media/upload/`.

## Resultado Esperado

### Conteúdos

- **Aluno**: lista (`apiContents`) e detalhe (`apiContentDetail`) como
  [`apps/web/src/app/aluno/conteudos/`](apps/web/src/app/aluno/conteudos/) e
  `[id]/page.tsx` — texto, imagem com URL absoluta, vídeo reproduzível
- **Professor**: lista, criar, editar, visualizar detalhe, excluir (`apiDeleteContent`)
  como [`apps/web/src/app/professor/conteudos/`](apps/web/src/app/professor/conteudos/)
- uploads de imagem/vídeo no editor usando `apiUploadMedia` + campos no payload
  de create/update (como [`ContentEditor.tsx`](apps/web/src/modules/contents/ContentEditor.tsx))

### Calendário

- **Aluno**: eventos + notas pessoais + criação de nota; UI pode ser grade
  mensal simplificada ou lista agrupada, desde que os dados e ações espelhem
  [`apps/web/src/app/aluno/calendario/page.tsx`](apps/web/src/app/aluno/calendario/page.tsx)
- **Professor**: equivalente a
  [`apps/web/src/app/professor/calendario/page.tsx`](apps/web/src/app/professor/calendario/page.tsx)
  (`apiCalendarEvents`, `apiCreateCalendarEvent`, `apiCalendarNotes`,
  `apiCreateCalendarNote` conforme uso na web)

### Perfil

- carregar e atualizar perfil (`apiProfile`, `apiUpdateProfile`)
- avatar: upload via `apiUploadMedia` + `apiUpdateAvatar` como nas páginas web
  de perfil

### Tarefas (complemento da Fase 2)

- anexo de **trabalho** no aluno: seleção de arquivo + envio no formato esperado
  pela API (espelhar web)
- **imagem de apoio** em questões no editor do professor (`ActivityEditor`):
  `apiUploadMedia` kind `activity_support_image`

## Entradas

- [`apps/web/src/modules/contents/ContentEditor.tsx`](apps/web/src/modules/contents/ContentEditor.tsx)
- [`apps/web/src/components/MediaImage.tsx`](apps/web/src/components/MediaImage.tsx) (padrão de URL)
- [`apps/web/src/app/aluno/calendario/page.tsx`](apps/web/src/app/aluno/calendario/page.tsx)
- [`apps/web/src/app/professor/calendario/page.tsx`](apps/web/src/app/professor/calendario/page.tsx)
- [`apps/web/src/app/aluno/perfil/page.tsx`](apps/web/src/app/aluno/perfil/page.tsx)
- [`apps/web/src/app/professor/perfil/page.tsx`](apps/web/src/app/professor/perfil/page.tsx)
- [`apps/api/core/media_views.py`](apps/api/core/media_views.py) (regras de `kind`)

## Diretriz Geral

- usar **Expo SDK alinhado ao projeto** (ex.: `expo-image-picker`,
  `expo-document-picker`) para arquivos
- `FormData` no React Native: anexar com `{ uri, name, type }` em iOS/Android
- vídeo em conteúdo: `expo-av` `Video` (ou alternativa documentada) com URL
  completa da API
- tratar permissões negadas com mensagem amigável em português

## Micro-wave 16.1: Uploads e utilitário de URL de mídia

### Escopo

Garantir `apiUploadMedia` funcional de ponta a ponta; helper `resolveMediaUrl(path)`
usando `getApiOrigin`.

### Regras

- kinds válidos iguais à web (`avatar`, `content_image`, `content_video`,
  `activity_support_image`, …)

## Micro-wave 16.2: Conteúdos aluno e professor

### Escopo

Implementar telas listadas em “Conteúdos” acima; componente de imagem reutilizável
(`Image` + `resizeMode`).

## Micro-wave 16.3: Calendário

### Escopo

Sincronizar fetch de eventos e notas; formulário de nova nota (e evento, se
professor/aluno conforme web); estados loading/erro.

## Micro-wave 16.4: Perfil e retorno às tarefas com anexo

### Escopo

Perfil completo; completar envio de trabalho com arquivo no aluno; imagem de apoio
no editor do professor.

## Critérios de Aceite

- professor cria conteúdo com imagem/vídeo local e vê preview como na web
- aluno abre conteúdo e reproduz vídeo quando existir
- calendário: criar nota e ver refletido após reload ou invalidação de cache
- avatar atualiza e aparece após refresh do perfil
- anexo de trabalho e imagem de apoio passam nas validações da API

## Dependência

- [Wave 15 — Núcleo acadêmico](wave-15-mobile-fase-2-nucleo-academico.md)

## Próxima fase

- [`wave-17-mobile-fase-4-comunidade-jogos-polish.md`](wave-17-mobile-fase-4-comunidade-jogos-polish.md)
