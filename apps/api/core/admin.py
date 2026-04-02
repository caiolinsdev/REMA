from django.contrib import admin

from core.models import (
    Activity,
    AuthSession,
    CalendarEvent,
    CommunityApproval,
    CommunityComment,
    CommunityPost,
    Content,
    PersonalCalendarNote,
    Question,
    QuestionOption,
    Review,
    Submission,
    SubmissionAnswer,
    SubmissionFile,
    UserProfile,
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "display_name")
    list_filter = ("role",)
    search_fields = ("user__email", "user__username", "display_name")


@admin.register(AuthSession)
class AuthSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "key", "created_at", "last_used_at")
    search_fields = ("user__email", "user__username", "key")
    readonly_fields = ("created_at", "last_used_at")


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 0


class QuestionInline(admin.StackedInline):
    model = Question
    extra = 0


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("title", "kind", "status", "total_score", "created_by", "due_at")
    list_filter = ("kind", "status")
    search_fields = ("title", "description", "created_by__email", "created_by__username")
    inlines = (QuestionInline,)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("activity", "position", "type", "weight")
    list_filter = ("type", "activity__kind")
    search_fields = ("statement", "activity__title")
    inlines = (QuestionOptionInline,)


class SubmissionAnswerInline(admin.TabularInline):
    model = SubmissionAnswer
    extra = 0


class SubmissionFileInline(admin.TabularInline):
    model = SubmissionFile
    extra = 0


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("activity", "student", "status", "submitted_at", "score")
    list_filter = ("status", "activity__kind")
    search_fields = ("activity__title", "student__email", "student__username")
    inlines = (SubmissionAnswerInline, SubmissionFileInline)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("submission", "reviewed_by", "score", "reviewed_at")
    search_fields = ("submission__activity__title", "reviewed_by__email")


@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "author", "published_at")
    list_filter = ("status",)
    search_fields = ("title", "subtitle", "author__email", "author__username")


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "start_at", "end_at", "created_by", "source_activity")
    list_filter = ("type",)
    search_fields = ("title", "description")


@admin.register(PersonalCalendarNote)
class PersonalCalendarNoteAdmin(admin.ModelAdmin):
    list_display = ("title", "student", "start_at", "end_at")
    search_fields = ("title", "description", "student__email", "student__username")


class CommunityApprovalInline(admin.TabularInline):
    model = CommunityApproval
    extra = 0


class CommunityCommentInline(admin.TabularInline):
    model = CommunityComment
    extra = 0


@admin.register(CommunityPost)
class CommunityPostAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "audience", "status", "created_at")
    list_filter = ("audience", "status")
    search_fields = ("title", "body", "author__email", "author__username")
    inlines = (CommunityApprovalInline, CommunityCommentInline)
