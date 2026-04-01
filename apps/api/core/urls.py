from django.urls import path

from core.views import api_info, healthcheck

urlpatterns = [
    path("", api_info, name="api-info"),
    path("health/", healthcheck, name="healthcheck"),
]
