from django.db import migrations


def drop_legacy_game_provider_columns(apps, schema_editor):
    Game = apps.get_model("core", "Game")
    connection = schema_editor.connection
    table_name = Game._meta.db_table
    legacy_columns = {
        "provider",
        "external_id",
        "thumbnail_url",
        "launch_url",
    }

    with connection.cursor() as cursor:
        existing_columns = {
            column.name
            for column in connection.introspection.get_table_description(cursor, table_name)
        }

    for column_name in sorted(legacy_columns & existing_columns):
        quoted_table = schema_editor.quote_name(table_name)
        quoted_column = schema_editor.quote_name(column_name)
        if connection.vendor == "postgresql":
            schema_editor.execute(
                f"ALTER TABLE {quoted_table} DROP COLUMN {quoted_column} CASCADE"
            )
        else:
            schema_editor.execute(
                f"ALTER TABLE {quoted_table} DROP COLUMN {quoted_column}"
            )


def curate_games(apps, schema_editor):
    Game = apps.get_model("core", "Game")
    curated_catalog = [
        {
            "slug": "forca",
            "title": "Forca",
            "description": "Descubra a palavra em portugues letra por letra antes de acabar as tentativas.",
            "instructions": "Escolha letras, revele a palavra e tente concluir sem esgotar as tentativas.",
            "experience_type": "palavras",
            "estimated_minutes": 5,
            "status": "published",
        },
        {
            "slug": "sudoku",
            "title": "Sudoku",
            "description": "Complete a grade sem repetir numeros nas linhas, colunas e blocos.",
            "instructions": "Preencha os espacos vazios e valide a solucao quando terminar.",
            "experience_type": "logica",
            "estimated_minutes": 10,
            "status": "published",
        },
        {
            "slug": "quiz-portugues",
            "title": "Quiz de Portugues",
            "description": "Responda perguntas de lingua portuguesa com foco em gramatica e uso.",
            "instructions": "Leia as alternativas, escolha a melhor resposta e envie o quiz para ver o resultado.",
            "experience_type": "quiz",
            "estimated_minutes": 6,
            "status": "published",
        },
        {
            "slug": "quiz-matematica",
            "title": "Quiz de Matematica",
            "description": "Resolva perguntas objetivas de matematica com apoio de fonte externa quando possivel.",
            "instructions": "Responda as questoes e envie o quiz para calcular score e progresso.",
            "experience_type": "quiz",
            "estimated_minutes": 6,
            "status": "published",
        },
        {
            "slug": "labirinto",
            "title": "Labirinto",
            "description": "Encontre o caminho do inicio ao fim num labirinto gerado para a sessao.",
            "instructions": "Movimente-se pelas celulas livres ate alcancar a saida.",
            "experience_type": "logica",
            "estimated_minutes": 7,
            "status": "published",
        },
    ]

    desired_slugs = {item["slug"] for item in curated_catalog}
    Game.objects.exclude(slug__in=desired_slugs).update(status="archived")
    for item in curated_catalog:
        Game.objects.update_or_create(slug=item["slug"], defaults=item)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0008_mediaasset"),
    ]

    operations = [
        migrations.RunPython(
            drop_legacy_game_provider_columns, migrations.RunPython.noop
        ),
        migrations.RunPython(curate_games, migrations.RunPython.noop),
    ]
