# Modulos do Professor

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
- conteudos criados ou pendentes
- agenda academica
- atalhos para comunidade e perfil

## Provas / Atividades / Trabalhos

### Papel da view

Centralizar criacao, publicacao e acompanhamento de atividades.

### Capacidades esperadas

- listar atividades
- criar nova atividade
- editar configuracoes
- publicar
- acompanhar status
- ver envios dos alunos
- atribuir nota e retorno
- criar questoes e configurar pontuacao

### Regras conhecidas

- `Prova` e `Atividade` sao conjuntos de questoes
- O limite e de `100` questoes por prova ou atividade
- `Provas`, `Atividades` e `Trabalhos` possuem pontuacao maxima de `100`
- Quando houver valor por questao, a soma precisa resultar em `100`
- Cada questao pode ser:
  - `dissertativa`
  - `multipla escolha` com ate `5` opcoes
- A questao pode conter imagem para interpretacao
- Toda questao pode ter explicacao esperada ou gabarito nao visivel ao aluno
- `Trabalho` exige comentario obrigatorio do professor ao validar

### Capacidades esperadas na pratica

- criar prova
- criar atividade
- criar trabalho com descricao livre
- definir valor total
- cadastrar questoes
- acompanhar envio do aluno
- corrigir quando aplicavel
- registrar nota
- registrar comentario obrigatorio em trabalhos

## Conteudos

### Papel da view

Gerenciar materiais pedagogicos.

### Capacidades esperadas

- criar conteudo
- editar conteudo
- excluir conteudo
- publicar
- organizar por grupos logicos
- definir titulo, subtitulo, descricao, imagem ou video

## Calendario

### Papel da view

Oferecer visao temporal dos compromissos academicos.

### Capacidades esperadas

- ver agenda
- abrir evento
- criar ou atualizar evento, se for parte do papel do professor
- acompanhar impactos automaticos de datas de entrega no calendario

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
2. `Provas / atividades / trabalhos`
3. `Conteudos`
4. `Calendario`
5. `Perfil`
6. `Comunidade`
