from django.conf import settings
from django.http import JsonResponse


def healthcheck(_request):
    return JsonResponse(
        {
            "service": "rema-api",
            "status": "ok",
            "environment": "development" if settings.DEBUG else "production",
        }
    )


def api_info(_request):
    return JsonResponse(
        {
            "name": "REMA API",
            "stack": ["Django", "PostgreSQL", "Docker"],
            "healthcheckUrl": "/api/health/",
        }
    )
