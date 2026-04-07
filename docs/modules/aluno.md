# Módulos do Aluno

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
- tarefas próximas
- conteúdos recentes
- agenda curta
- atalhos rapidos

## Tarefas

### Papel da view

Centralizar o acompanhamento das entregas academicas.

### Capacidades esperadas

- listar atividades
- abrir detalhes
- exibir prazo
- mostrar status
- responder questões quando a tarefa usar formulário
- enviar arquivo quando a tarefa exigir anexo
- ver nota e retorno após avaliação

### Regras conhecidas

- Internamente, `prova` e `atividade` são conjuntos de questões
- Internamente, `trabalho` é uma atividade com descrição livre e upload de arquivo
- O aluno envia apenas uma vez e não pode editar depois do envio
- Antes do envio deve existir confirmação explícita
- A mesma view pode ser reaproveitada para realizacao e consulta de nota
- As questões podem ser:
  - `dissertativas`
  - `multipla escolha` com ate `5` opcoes
- A questão pode conter imagem
- O aluno não vê explicação esperada ou gabarito durante a realização

### Capacidades esperadas na pratica

- ver lista unificada de tarefas
- distinguir o comportamento da tarefa
- preencher respostas
- anexar `PDF`, `Word` ou `TXT` em tarefas com anexo
- receber mensagem de confirmação antes de enviar
- consultar status de envio
- consultar nota e comentario quando disponiveis

## Conteúdos

### Papel da view

Reunir os materiais que apoiam o estudo do aluno.

### Capacidades esperadas

- listar conteúdos
- filtrar por categoria, tema ou disciplina
- abrir detalhe
- consumir material
- visualizar título, subtítulo, descrição, autor e data de postagem
- consumir imagem ou video quando houver

## Calendário

### Papel da view

Dar visibilidade temporal a rotina do aluno.

### Capacidades esperadas

- ver eventos e prazos
- navegar por periodo
- abrir detalhe do compromisso
- visualizar automaticamente prazos de tarefas
- criar anotações pessoais individuais

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
2. `Tarefas`
3. `Conteúdos`
4. `Calendário`
5. `Perfil`
6. `Comunidade`
7. `Jogos`
