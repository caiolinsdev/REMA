import secrets

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class UserProfile(models.Model):
    class Role(models.TextChoices):
        ALUNO = "aluno", "Aluno"
        PROFESSOR = "professor", "Professor"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ALUNO)
    display_name = models.CharField(max_length=255, blank=True)
    avatar_url = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"{self.user_id}:{self.role}"


class AuthSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="auth_sessions")
    key = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)

    @staticmethod
    def generate_key() -> str:
        return secrets.token_hex(32)

    def touch(self) -> None:
        self.last_used_at = timezone.now()
        self.save(update_fields=["last_used_at"])

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = self.generate_key()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.user_id}:{self.key[:8]}"


class Activity(models.Model):
    class Kind(models.TextChoices):
        PROVA = "prova", "Prova"
        ATIVIDADE = "atividade", "Atividade"
        TRABALHO = "trabalho", "Trabalho"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        CLOSED = "closed", "Closed"
        ARCHIVED = "archived", "Archived"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    kind = models.CharField(max_length=20, choices=Kind.choices)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    due_at = models.DateTimeField(blank=True, null=True)
    total_score = models.PositiveIntegerField(default=100)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="activities"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.kind})"


class Question(models.Model):
    class Type(models.TextChoices):
        DISSERTATIVA = "dissertativa", "Dissertativa"
        MULTIPLA_ESCOLHA = "multipla_escolha", "Multipla Escolha"

    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name="questions"
    )
    statement = models.TextField()
    type = models.CharField(max_length=30, choices=Type.choices)
    weight = models.PositiveIntegerField(default=0)
    support_image_url = models.URLField(blank=True, null=True)
    expected_answer = models.TextField(blank=True)
    position = models.PositiveIntegerField()

    class Meta:
        ordering = ["position", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["activity", "position"], name="unique_question_position"
            )
        ]

    def __str__(self) -> str:
        return f"{self.activity_id}:{self.position}"


class QuestionOption(models.Model):
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="options"
    )
    label = models.CharField(max_length=255)
    position = models.PositiveIntegerField()
    is_correct = models.BooleanField(default=False)

    class Meta:
        ordering = ["position", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["question", "position"], name="unique_option_position"
            )
        ]

    def __str__(self) -> str:
        return f"{self.question_id}:{self.position}"


class Submission(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        SUBMITTED = "submitted", "Submitted"
        REVIEWED = "reviewed", "Reviewed"

    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name="submissions"
    )
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="submissions"
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    submitted_at = models.DateTimeField(blank=True, null=True)
    score = models.PositiveIntegerField(blank=True, null=True)
    feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["activity", "student"], name="unique_submission_per_student"
            )
        ]

    def __str__(self) -> str:
        return f"{self.activity_id}:{self.student_id}:{self.status}"


class SubmissionAnswer(models.Model):
    submission = models.ForeignKey(
        Submission, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="submission_answers"
    )
    answer_text = models.TextField(blank=True)
    selected_option = models.ForeignKey(
        QuestionOption,
        on_delete=models.SET_NULL,
        related_name="selected_in_answers",
        blank=True,
        null=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["submission", "question"], name="unique_submission_answer"
            )
        ]

    def __str__(self) -> str:
        return f"{self.submission_id}:{self.question_id}"


class SubmissionFile(models.Model):
    submission = models.ForeignKey(
        Submission, on_delete=models.CASCADE, related_name="files"
    )
    file_name = models.CharField(max_length=255)
    file_url = models.TextField()
    file_type = models.CharField(max_length=20)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.submission_id}:{self.file_name}"


class Review(models.Model):
    submission = models.OneToOneField(
        Submission, on_delete=models.CASCADE, related_name="review"
    )
    reviewed_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="reviews"
    )
    score = models.PositiveIntegerField()
    comment = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.submission_id}:{self.score}"


class Content(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="contents"
    )
    published_at = models.DateTimeField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    video_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class CalendarEvent(models.Model):
    class Type(models.TextChoices):
        DELIVERY_PROVA = "delivery_prova", "Prazo Prova"
        DELIVERY_ATIVIDADE = "delivery_atividade", "Prazo Atividade"
        DELIVERY_TRABALHO = "delivery_trabalho", "Prazo Trabalho"
        OTHER = "other", "Outro"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=30, choices=Type.choices, default=Type.OTHER)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="calendar_events",
        blank=True,
        null=True,
    )
    source_activity = models.ForeignKey(
        Activity,
        on_delete=models.SET_NULL,
        related_name="calendar_events",
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_at", "id"]

    def __str__(self) -> str:
        return self.title


class PersonalCalendarNote(models.Model):
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="calendar_notes"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    start_at = models.DateTimeField()
    end_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_at", "id"]

    def __str__(self) -> str:
        return f"{self.student_id}:{self.title}"
