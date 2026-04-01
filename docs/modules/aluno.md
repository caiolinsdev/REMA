# Modulos do Aluno

## Objetivo

Detalhar a leitura inicial dos modulos visiveis para o aluno a partir do
fluxograma.

## Home

### Papel da view

Ser a tela de entrada do aluno autenticado.

### Valor principal

- mostrar prioridades
- resumir rotina
- orientar o proximo clique

### Blocos provaveis

- proximas atividades
- provas proximas
- conteudos recentes
- agenda curta
- atalhos rapidos

## Provas / Atividades / Trabalhos

### Papel da view

Centralizar o acompanhamento das entregas academicas.

### Capacidades esperadas

- listar atividades
- abrir detalhes
- exibir prazo
- mostrar status
- responder questoes quando for prova ou atividade
- enviar arquivo quando for trabalho
- ver nota e retorno apos avaliacao

### Regras conhecidas

- `Prova` e `Atividade` sao conjuntos de questoes
- `Trabalho` e uma atividade com descricao livre e upload de arquivo
- O aluno envia apenas uma vez e nao pode editar depois do envio
- Antes do envio deve existir confirmacao explicita
- A mesma view pode ser reaproveitada para realizacao e consulta de nota
- As questoes podem ser:
  - `dissertativas`
  - `multipla escolha` com ate `5` opcoes
- A questao pode conter imagem
- O aluno nao ve explicacao esperada ou gabarito durante a realizacao

### Capacidades esperadas na pratica

- ver lista unificada de provas, atividades e trabalhos
- distinguir tipo do item
- preencher respostas
- anexar `PDF`, `Word` ou `TXT` em trabalhos
- receber mensagem de confirmacao antes de enviar
- consultar status de envio
- consultar nota e comentario quando disponiveis

## Conteudos

### Papel da view

Reunir os materiais que apoiam o estudo do aluno.

### Capacidades esperadas

- listar conteudos
- filtrar por categoria, tema ou disciplina
- abrir detalhe
- consumir material
- visualizar titulo, subtitulo, descricao, autor e data de postagem
- consumir imagem ou video quando houver

## Calendario

### Papel da view

Dar visibilidade temporal a rotina do aluno.

### Capacidades esperadas

- ver eventos e prazos
- navegar por periodo
- abrir detalhe do compromisso
- visualizar automaticamente prazos de provas, atividades e trabalhos
- criar anotacoes pessoais individuais

## Jogos

### Papel da view

Adicionar camada de engajamento ao aprendizado.

### Capacidades esperadas

- descobrir jogos ou desafios
- iniciar experiencia
- acompanhar progresso, pontos ou retorno
- acessar um conjunto inicial de `4` a `5` jogos

### Risco de escopo

E o modulo menos definido do fluxograma e deve ser tratado como trilha
exploratoria ate que sua proposta pedagogica esteja clara.

## Comunidade

### Papel da view

Promover interacao entre alunos.

### Capacidades esperadas

- visualizar publicacoes ou topicos
- criar post com texto, imagem, video ou gif
- acompanhar se o post esta pendente ou aprovado
- interagir apenas com posts aprovados
- navegar por assuntos

### Riscos

- moderacao
- seguranca
- convivencia entre faixas etarias diferentes

## Perfil

### Papel da view

Dar ao aluno um espaco de identidade e configuracao.

### Capacidades esperadas

- visualizar informacoes
- editar dados permitidos
- configurar preferencias
- incluir foto de perfil

## Ordem Recomendada de Aprofundamento

1. `Home`
2. `Provas / atividades / trabalhos`
3. `Conteudos`
4. `Calendario`
5. `Perfil`
6. `Comunidade`
7. `Jogos`
