from django.urls import path

from core import (
    activities_views,
    auth_views,
    calendar_views,
    community_views,
    content_views,
    games_views,
    home_views,
    media_views,
    profile_views,
    submissions_views,
)
from core.views import api_info, healthcheck

urlpatterns = [
    path("", api_info, name="api-info"),
    path("health/", healthcheck, name="healthcheck"),
    path("auth/login/", auth_views.auth_login, name="auth-login"),
    path("auth/me/", auth_views.auth_me, name="auth-me"),
    path("auth/logout/", auth_views.auth_logout, name="auth-logout"),
    path("home/student-summary/", home_views.student_home_summary, name="student-home-summary"),
    path("home/teacher-summary/", home_views.teacher_home_summary, name="teacher-home-summary"),
    path("profile/", profile_views.profile_item, name="profile-item"),
    path("profile/avatar/", profile_views.profile_avatar, name="profile-avatar"),
    path("media/upload/", media_views.media_upload, name="media-upload"),
    path("games/", games_views.games_collection, name="games"),
    path("games/sessions/", games_views.student_game_sessions, name="game-sessions"),
    path("games/<int:game_id>/", games_views.game_item, name="game-item"),
    path("games/<int:game_id>/runtime/", games_views.game_runtime, name="game-runtime"),
    path(
        "games/<int:game_id>/sessions/",
        games_views.game_sessions_collection,
        name="game-sessions-collection",
    ),
    path("community/posts/", community_views.community_posts_collection, name="community-posts"),
    path(
        "community/posts/<int:post_id>/",
        community_views.community_post_item,
        name="community-post-item",
    ),
    path(
        "community/posts/<int:post_id>/approve/",
        community_views.community_post_approve,
        name="community-post-approve",
    ),
    path(
        "community/posts/<int:post_id>/reject/",
        community_views.community_post_reject,
        name="community-post-reject",
    ),
    path("contents/", content_views.contents_collection, name="contents"),
    path("contents/<int:content_id>/", content_views.content_item, name="content-item"),
    path("calendar/events/", calendar_views.calendar_events_collection, name="calendar-events"),
    path(
        "calendar/events/<int:event_id>/",
        calendar_views.calendar_event_item,
        name="calendar-event-item",
    ),
    path("calendar/notes/", calendar_views.calendar_notes_collection, name="calendar-notes"),
    path(
        "calendar/notes/<int:note_id>/",
        calendar_views.calendar_note_item,
        name="calendar-note-item",
    ),
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
