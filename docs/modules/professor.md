# Módulos do Professor

## Objetivo

Detalhar a leitura inicial dos modulos visiveis para o professor a partir do
fluxograma.

## Home

### Papel da view

Ser a central operacional do professor autenticado.

### Valor principal

- mostrar o que exige acao
- resumir agenda e publicacoes
- facilitar acesso aos modulos centrais

### Blocos provaveis

- atividades recentes
- conteúdos criados ou pendentes
- agenda acadêmica
- atalhos para comunidade e perfil

## Tarefas

### Papel da view

Centralizar criação, publicação e acompanhamento de tarefas.

### Capacidades esperadas

- listar atividades
- criar nova tarefa
- editar configurações
- publicar
- acompanhar status
- ver envios dos alunos
- atribuir nota e retorno
- criar questões e configurar pontuação

### Regras conhecidas

- Internamente, `prova` e `atividade` são conjuntos de questões
- O limite é de `100` questões por tarefa com questões
- As tarefas possuem pontuação máxima de `100`
- Quando houver valor por questão, a soma precisa resultar em `100`
- Cada questão pode ser:
  - `dissertativa`
  - `multipla escolha` com ate `5` opcoes
- A questão pode conter imagem para interpretação
- Toda questão pode ter explicação esperada ou gabarito não visível ao aluno
- Tarefa com anexo exige comentário obrigatório do professor ao validar

### Capacidades esperadas na pratica

- criar tarefa com questões
- criar tarefa com anexo
- definir valor total
- cadastrar questoes
- acompanhar envio do aluno
- corrigir quando aplicavel
- registrar nota
- registrar comentário obrigatório em tarefas com anexo

## Conteúdos

### Papel da view

Gerenciar materiais pedagogicos.

### Capacidades esperadas

- criar conteúdo
- editar conteúdo
- excluir conteúdo
- publicar
- organizar por grupos logicos
- definir título, subtítulo, descrição, imagem ou vídeo

## Calendário

### Papel da view

Oferecer visão temporal dos compromissos acadêmicos.

### Capacidades esperadas

- ver agenda
- abrir evento
- criar ou atualizar evento, se for parte do papel do professor
- acompanhar impactos automáticos de datas de entrega no calendário

## Comunidade

### Papel da view

Promover troca entre professores.

### Capacidades esperadas

- ver feed, mural ou topicos
- publicar
- comentar
- interagir com colegas
- aprovar posts dos alunos
- visualizar posts dos alunos para moderacao

## Perfil

### Papel da view

Gerenciar identidade profissional e preferencias.

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
