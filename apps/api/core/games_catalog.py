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
        "description": "Descubra a palavra em português letra por letra antes de acabar as tentativas.",
        "instructions": "Escolha letras, revele a palavra e tente concluir sem esgotar as tentativas.",
        "experience_type": Game.ExperienceType.PALAVRAS,
        "estimated_minutes": 5,
        "game_key": "hangman",
        "source_strategy": "hybrid",
    },
    {
        "slug": "sudoku",
        "title": "Sudoku",
        "description": "Complete a grade sem repetir números nas linhas, colunas e blocos.",
        "instructions": "Preencha os espaços vazios e valide a solução quando terminar.",
        "experience_type": Game.ExperienceType.LOGICA,
        "estimated_minutes": 10,
        "game_key": "sudoku",
        "source_strategy": "remote_api",
    },
    {
        "slug": "quiz-portugues",
        "title": "Quiz de Português",
        "description": "Responda perguntas de língua portuguesa com foco em gramática e uso.",
        "instructions": "Leia as alternativas, escolha a melhor resposta e envie o quiz para ver o resultado.",
        "experience_type": Game.ExperienceType.QUIZ,
        "estimated_minutes": 6,
        "game_key": "quiz_portuguese",
        "source_strategy": "local_engine",
    },
    {
        "slug": "quiz-matematica",
        "title": "Quiz de Matemática",
        "description": "Resolva perguntas objetivas de matemática com apoio de fonte externa quando possível.",
        "instructions": "Responda as questões e envie o quiz para calcular score e progresso.",
        "experience_type": Game.ExperienceType.QUIZ,
        "estimated_minutes": 6,
        "game_key": "quiz_math",
        "source_strategy": "remote_api",
    },
    {
        "slug": "labirinto",
        "title": "Labirinto",
        "description": "Encontre o caminho do início ao fim em um labirinto gerado para a sessão.",
        "instructions": "Movimente-se pelas células livres até alcançar a saída.",
        "experience_type": Game.ExperienceType.LOGICA,
        "estimated_minutes": 7,
        "game_key": "maze",
        "source_strategy": "remote_api",
    },
]


GAME_CONFIG_BY_SLUG = {item["slug"]: item for item in CURATED_GAMES}
