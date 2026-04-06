from __future__ import annotations

from typing import TypedDict

from core.models import Game


class CuratedGameConfig(TypedDict):
    slug: str
    title: str
    description: str
    instructions: str
    experience_type: str
    estimated_minutes: int
    game_key: str
    source_strategy: str


CURATED_GAMES: list[CuratedGameConfig] = [
    {
        "slug": "forca",
        "title": "Forca",
        "description": "Descubra a palavra em portugues letra por letra antes de acabar as tentativas.",
        "instructions": "Escolha letras, revele a palavra e tente concluir sem esgotar as tentativas.",
        "experience_type": Game.ExperienceType.PALAVRAS,
        "estimated_minutes": 5,
        "game_key": "hangman",
        "source_strategy": "hybrid",
    },
    {
        "slug": "sudoku",
        "title": "Sudoku",
        "description": "Complete a grade sem repetir numeros nas linhas, colunas e blocos.",
        "instructions": "Preencha os espacos vazios e valide a solucao quando terminar.",
        "experience_type": Game.ExperienceType.LOGICA,
        "estimated_minutes": 10,
        "game_key": "sudoku",
        "source_strategy": "remote_api",
    },
    {
        "slug": "quiz-portugues",
        "title": "Quiz de Portugues",
        "description": "Responda perguntas de lingua portuguesa com foco em gramatica e uso.",
        "instructions": "Leia as alternativas, escolha a melhor resposta e envie o quiz para ver o resultado.",
        "experience_type": Game.ExperienceType.QUIZ,
        "estimated_minutes": 6,
        "game_key": "quiz_portuguese",
        "source_strategy": "local_engine",
    },
    {
        "slug": "quiz-matematica",
        "title": "Quiz de Matematica",
        "description": "Resolva perguntas objetivas de matematica com apoio de fonte externa quando possivel.",
        "instructions": "Responda as questoes e envie o quiz para calcular score e progresso.",
        "experience_type": Game.ExperienceType.QUIZ,
        "estimated_minutes": 6,
        "game_key": "quiz_math",
        "source_strategy": "remote_api",
    },
    {
        "slug": "labirinto",
        "title": "Labirinto",
        "description": "Encontre o caminho do inicio ao fim num labirinto gerado para a sessao.",
        "instructions": "Movimente-se pelas celulas livres ate alcancar a saida.",
        "experience_type": Game.ExperienceType.LOGICA,
        "estimated_minutes": 7,
        "game_key": "maze",
        "source_strategy": "remote_api",
    },
]


GAME_CONFIG_BY_SLUG = {item["slug"]: item for item in CURATED_GAMES}
