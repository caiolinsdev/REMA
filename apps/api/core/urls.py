from django.urls import path

from core import activities_views, auth_views, submissions_views
from core.views import api_info, healthcheck

urlpatterns = [
    path("", api_info, name="api-info"),
    path("health/", healthcheck, name="healthcheck"),
    path("auth/login/", auth_views.auth_login, name="auth-login"),
    path("auth/me/", auth_views.auth_me, name="auth-me"),
    path("auth/logout/", auth_views.auth_logout, name="auth-logout"),
    path("activities/", activities_views.activities_collection, name="activities"),
    path("activities/<int:activity_id>/", activities_views.activity_item, name="activity-item"),
    path(
        "activities/<int:activity_id>/publish/",
        activities_views.activity_publish,
        name="activity-publish",
    ),
    path(
        "activities/<int:activity_id>/questions/",
        activities_views.activity_questions_collection,
        name="activity-questions",
    ),
    path(
        "activities/<int:activity_id>/submissions/",
        submissions_views.activity_submissions_collection,
        name="activity-submissions",
    ),
    path(
        "activities/<int:activity_id>/submissions/current/",
        submissions_views.current_submission,
        name="current-submission",
    ),
    path("questions/<int:question_id>/", activities_views.question_item, name="question-item"),
    path(
        "submissions/<int:submission_id>/",
        submissions_views.submission_item,
        name="submission-item",
    ),
    path(
        "submissions/<int:submission_id>/confirm/",
        submissions_views.submission_confirm,
        name="submission-confirm",
    ),
    path(
        "submissions/<int:submission_id>/review/",
        submissions_views.submission_review,
        name="submission-review",
    ),
]
