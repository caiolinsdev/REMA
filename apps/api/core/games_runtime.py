from __future__ import annotations

import html
import json
import random
import unicodedata
from dataclasses import dataclass
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from core.games_catalog import GAME_CONFIG_BY_SLUG

PT_WORD_FALLBACK = [
    "escola",
    "janela",
    "caderno",
    "abacaxi",
    "girassol",
    "planeta",
    "amizade",
    "matematica",
]

PORTUGUESE_QUIZ_FALLBACK = [
    {
        "id": "pt-1",
        "prompt": "Qual frase esta corretamente pontuada?",
        "options": [
            {"id": "a", "label": "Vamos estudar, matematica."},
            {"id": "b", "label": "Vamos estudar matematica."},
            {"id": "c", "label": "Vamos, estudar matematica."},
            {"id": "d", "label": "Vamos estudar matematica,"},
        ],
        "correctOptionId": "b",
    },
    {
        "id": "pt-2",
        "prompt": "Em qual opcao todas as palavras estao escritas corretamente?",
        "options": [
            {"id": "a", "label": "Excecao, necessario, pesquisa"},
            {"id": "b", "label": "Excessao, nescessario, pesquiza"},
            {"id": "c", "label": "Exceção, neceçario, pesquisa"},
            {"id": "d", "label": "Exceção, necessário, pesquiza"},
        ],
        "correctOptionId": "a",
    },
    {
        "id": "pt-3",
        "prompt": "Qual palavra e um verbo?",
        "options": [
            {"id": "a", "label": "rapido"},
            {"id": "b", "label": "cantar"},
            {"id": "c", "label": "mesa"},
            {"id": "d", "label": "azul"},
        ],
        "correctOptionId": "b",
    },
    {
        "id": "pt-4",
        "prompt": "Qual frase usa corretamente o plural?",
        "options": [
            {"id": "a", "label": "Os menino chegaram."},
            {"id": "b", "label": "Os meninos chegaram."},
            {"id": "c", "label": "O meninos chegaram."},
            {"id": "d", "label": "Os meninos chegou."},
        ],
        "correctOptionId": "b",
    },
]

MATH_QUIZ_FALLBACK = [
    {
        "id": "math-1",
        "prompt": "Quanto e 7 x 8?",
        "options": [
            {"id": "a", "label": "54"},
            {"id": "b", "label": "56"},
            {"id": "c", "label": "64"},
            {"id": "d", "label": "58"},
        ],
        "correctOptionId": "b",
    },
    {
        "id": "math-2",
        "prompt": "Qual e o resultado de 36 / 6?",
        "options": [
            {"id": "a", "label": "5"},
            {"id": "b", "label": "6"},
            {"id": "c", "label": "7"},
            {"id": "d", "label": "8"},
        ],
        "correctOptionId": "b",
    },
    {
        "id": "math-3",
        "prompt": "Qual fracao equivale a 0,5?",
        "options": [
            {"id": "a", "label": "1/5"},
            {"id": "b", "label": "1/4"},
            {"id": "c", "label": "1/2"},
            {"id": "d", "label": "2/5"},
        ],
        "correctOptionId": "c",
    },
    {
        "id": "math-4",
        "prompt": "Quanto e 15 + 27?",
        "options": [
            {"id": "a", "label": "42"},
            {"id": "b", "label": "41"},
            {"id": "c", "label": "43"},
            {"id": "d", "label": "39"},
        ],
        "correctOptionId": "a",
    },
]

SUDOKU_FALLBACK = {
    "puzzle": [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    "solution": [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
    "difficulty": "medium",
}


@dataclass(frozen=True)
class RuntimeEnvelope:
    kind: str
    source_strategy: str
    content_source: str
    payload: dict


def _fetch_json(url: str) -> object:
    request = Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "REMA/1.0"},
    )
    with urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def _normalize_word(word: str) -> str:
    normalized = unicodedata.normalize("NFKD", word.lower())
    ascii_word = normalized.encode("ascii", "ignore").decode("ascii")
    cleaned = "".join(char for char in ascii_word if char.isalpha())
    if len(cleaned) < 4:
        raise ValueError("Palavra remota invalida.")
    return cleaned


def _hangman_runtime() -> RuntimeEnvelope:
    try:
        data = _fetch_json("https://random-word-api.herokuapp.com/word?lang=pt-br&number=1")
        if not isinstance(data, list) or not data:
            raise ValueError("Resposta invalida.")
        word = _normalize_word(str(data[0]))
        source = "remote_api"
    except Exception:
        word = random.choice(PT_WORD_FALLBACK)
        source = "local_fallback"

    return RuntimeEnvelope(
        kind="hangman",
        source_strategy="hybrid",
        content_source=source,
        payload={
            "solutionWord": word,
            "maxAttempts": 6,
            "alphabet": list("abcdefghijklmnopqrstuvwxyz"),
        },
    )


def _sudoku_runtime() -> RuntimeEnvelope:
    try:
        data = _fetch_json(
            "https://sudoku-api.vercel.app/api/dosuku?query={newboard(limit:1){grids{value,solution,difficulty}}}"
        )
        grids = data["newboard"]["grids"]
        grid = grids[0]
        puzzle = grid["value"]
        solution = grid["solution"]
        difficulty = str(grid.get("difficulty") or "medium")
        source = "remote_api"
    except Exception:
        puzzle = SUDOKU_FALLBACK["puzzle"]
        solution = SUDOKU_FALLBACK["solution"]
        difficulty = SUDOKU_FALLBACK["difficulty"]
        source = "local_fallback"

    return RuntimeEnvelope(
        kind="sudoku",
        source_strategy="remote_api",
        content_source=source,
        payload={
            "puzzle": puzzle,
            "solution": solution,
            "difficulty": difficulty,
        },
    )


def _quiz_portuguese_runtime() -> RuntimeEnvelope:
    return RuntimeEnvelope(
        kind="quiz_portuguese",
        source_strategy="local_engine",
        content_source="local_engine",
        payload={"questions": PORTUGUESE_QUIZ_FALLBACK},
    )


def _normalize_math_quiz_results(results: list[dict]) -> list[dict]:
    normalized = []
    for index, item in enumerate(results, start=1):
        correct = html.unescape(str(item.get("correct_answer") or "")).strip()
        incorrect = [
            html.unescape(str(option)).strip()
            for option in item.get("incorrect_answers", [])
            if str(option).strip()
        ]
        prompt = html.unescape(str(item.get("question") or "")).strip()
        if not prompt or not correct or len(incorrect) < 3:
            continue
        all_options = incorrect[:3] + [correct]
        random.shuffle(all_options)
        options = []
        correct_option_id = ""
        for option_index, option in enumerate(all_options):
            option_id = f"opt-{index}-{option_index}"
            options.append({"id": option_id, "label": option})
            if option == correct:
                correct_option_id = option_id
        normalized.append(
            {
                "id": f"math-remote-{index}",
                "prompt": prompt,
                "options": options,
                "correctOptionId": correct_option_id,
            }
        )
    return normalized


def _quiz_math_runtime() -> RuntimeEnvelope:
    try:
        query = urlencode({"amount": 5, "category": 19, "type": "multiple"})
        data = _fetch_json(f"https://opentdb.com/api.php?{query}")
        results = _normalize_math_quiz_results(list(data.get("results") or []))
        if len(results) < 3:
            raise ValueError("Poucas perguntas validas.")
        source = "remote_api"
    except Exception:
        results = MATH_QUIZ_FALLBACK
        source = "local_fallback"

    return RuntimeEnvelope(
        kind="quiz_math",
        source_strategy="remote_api",
        content_source=source,
        payload={"questions": results},
    )


def _decode_maze_value(value: int) -> dict[str, bool]:
    return {
        "up": bool(value & 1),
        "right": bool(value & 2),
        "down": bool(value & 4),
        "left": bool(value & 8),
    }


def _generate_local_maze(rows: int, cols: int) -> list[list[int]]:
    grid = [[0 for _ in range(cols)] for _ in range(rows)]
    visited = [[False for _ in range(cols)] for _ in range(rows)]

    def dfs(row: int, col: int) -> None:
        visited[row][col] = True
        directions = [
            (-1, 0, 1, 4),
            (0, 1, 2, 8),
            (1, 0, 4, 1),
            (0, -1, 8, 2),
        ]
        random.shuffle(directions)
        for delta_row, delta_col, current_bit, next_bit in directions:
            next_row = row + delta_row
            next_col = col + delta_col
            if not (0 <= next_row < rows and 0 <= next_col < cols):
                continue
            if visited[next_row][next_col]:
                continue
            grid[row][col] |= current_bit
            grid[next_row][next_col] |= next_bit
            dfs(next_row, next_col)

    dfs(0, 0)
    return grid


def _maze_runtime() -> RuntimeEnvelope:
    rows = 8
    cols = 8
    try:
        data = _fetch_json(
            f"https://guillaumeroux.fr/maze/?rows={rows}&cols={cols}&json"
        )
        if not isinstance(data, list):
            raise ValueError("Resposta invalida de labirinto.")
        raw_grid = [[int(cell) for cell in row] for row in data]
        source = "remote_api"
    except Exception:
        raw_grid = _generate_local_maze(rows, cols)
        source = "local_fallback"

    cells = [
        [_decode_maze_value(cell) for cell in row]
        for row in raw_grid
    ]
    return RuntimeEnvelope(
        kind="maze",
        source_strategy="remote_api",
        content_source=source,
        payload={
            "rows": rows,
            "cols": cols,
            "cells": cells,
            "start": {"row": 0, "col": 0},
            "goal": {"row": rows - 1, "col": cols - 1},
        },
    )


def build_game_runtime(game) -> dict:
    config = GAME_CONFIG_BY_SLUG[game.slug]
    if game.slug == "forca":
        runtime = _hangman_runtime()
    elif game.slug == "sudoku":
        runtime = _sudoku_runtime()
    elif game.slug == "quiz-portugues":
        runtime = _quiz_portuguese_runtime()
    elif game.slug == "quiz-matematica":
        runtime = _quiz_math_runtime()
    elif game.slug == "labirinto":
        runtime = _maze_runtime()
    else:
        raise ValueError("Jogo nao suportado.")

    return {
        "gameId": str(game.id),
        "slug": game.slug,
        "kind": runtime.kind,
        "sourceStrategy": config["source_strategy"],
        "contentSource": runtime.content_source,
        "payload": runtime.payload,
    }
