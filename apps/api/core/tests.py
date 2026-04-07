import json
import shutil
import tempfile
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from core.models import (
    Activity,
    AuthSession,
    CalendarEvent,
    CommunityPost,
    Content,
    Game,
    GameSession,
    PersonalCalendarNote,
    Review,
    Submission,
    UserProfile,
)


class ApiEndpointsTests(TestCase):
    def test_healthcheck_endpoint(self):
        response = self.client.get(reverse("healthcheck"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_api_info_endpoint(self):
        response = self.client.get(reverse("api-info"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "REMA API")


class AuthFlowTests(TestCase):
    def setUp(self):
        self.password = "demo123456"
        self.student_user = User.objects.create_user(
            username="student-one",
            email="shared@example.com",
            password=self.password,
        )
        self.student_user.profile.role = UserProfile.Role.ALUNO
        self.student_user.profile.display_name = "Aluno One"
        self.student_user.profile.save()

    def test_login_works_even_if_other_user_has_same_email(self):
        other_user = User.objects.create_user(
            username="student-two",
            email="shared@example.com",
            password="another-password",
        )
        other_user.profile.role = UserProfile.Role.PROFESSOR
        other_user.profile.display_name = "Professor Two"
        other_user.profile.save()

        response = self.client.post(
            reverse("auth-login"),
            data=json.dumps(
                {"email": "shared@example.com", "password": self.password}
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["id"], str(self.student_user.id))

    def test_logins_create_independent_sessions(self):
        first_login = self.client.post(
            reverse("auth-login"),
            data=json.dumps(
                {"email": "shared@example.com", "password": self.password}
            ),
            content_type="application/json",
        )
        second_login = self.client.post(
            reverse("auth-login"),
            data=json.dumps(
                {"email": "shared@example.com", "password": self.password}
            ),
            content_type="application/json",
        )

        self.assertEqual(first_login.status_code, 200)
        self.assertEqual(second_login.status_code, 200)

        first_token = first_login.json()["token"]
        second_token = second_login.json()["token"]
        self.assertNotEqual(first_token, second_token)
        self.assertEqual(AuthSession.objects.filter(user=self.student_user).count(), 2)

        logout_response = self.client.post(
            reverse("auth-logout"), HTTP_AUTHORIZATION=f"Token {first_token}"
        )
        self.assertEqual(logout_response.status_code, 204)
        self.assertFalse(AuthSession.objects.filter(key=first_token).exists())
        self.assertTrue(AuthSession.objects.filter(key=second_token).exists())

        second_me = self.client.get(
            reverse("auth-me"), HTTP_AUTHORIZATION=f"Token {second_token}"
        )
        self.assertEqual(second_me.status_code, 200)


class ActivityFlowTests(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="teacher",
            email="teacher@example.com",
            password="demo123456",
        )
        self.teacher.profile.role = UserProfile.Role.PROFESSOR
        self.teacher.profile.display_name = "Professor Demo"
        self.teacher.profile.save()

        self.student = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="demo123456",
        )
        self.student.profile.role = UserProfile.Role.ALUNO
        self.student.profile.display_name = "Aluno Demo"
        self.student.profile.save()

        self.teacher_session = AuthSession.objects.create(user=self.teacher)
        self.student_session = AuthSession.objects.create(user=self.student)

    def _auth(self, session: AuthSession) -> dict[str, str]:
        return {"HTTP_AUTHORIZATION": f"Token {session.key}"}

    def test_professor_can_create_draft_activity_with_questions(self):
        response = self.client.post(
            reverse("activities"),
            data=json.dumps(
                {
                    "title": "Prova 1",
                    "description": "Conteudo de matematica",
                    "kind": "prova",
                    "totalScore": 100,
                    "questions": [
                        {
                            "statement": "Quanto e 2 + 2?",
                            "type": "multipla_escolha",
                            "weight": 100,
                            "position": 1,
                            "expectedAnswer": "4",
                            "options": [
                                {"label": "3", "position": 1, "isCorrect": False},
                                {"label": "4", "position": 2, "isCorrect": True},
                            ],
                        }
                    ],
                }
            ),
            content_type="application/json",
            **self._auth(self.teacher_session),
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["status"], "draft")
        self.assertTrue(payload["validation"]["canPublish"])
        self.assertEqual(payload["questions"][0]["expectedAnswer"], "4")

    def test_publish_is_blocked_when_validation_fails(self):
        activity = Activity.objects.create(
            title="Atividade incompleta",
            description="Sem pesos corretos",
            kind=Activity.Kind.ATIVIDADE,
            total_score=100,
            created_by=self.teacher,
        )

        response = self.client.post(
            reverse("activity-publish", args=[activity.id]),
            **self._auth(self.teacher_session),
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["validation"]["canPublish"])

    def test_student_only_sees_published_activities_and_hidden_answers(self):
        draft_activity = Activity.objects.create(
            title="Draft",
            description="Nao visivel",
            kind=Activity.Kind.PROVA,
            status=Activity.Status.DRAFT,
            total_score=100,
            created_by=self.teacher,
        )
        published_activity = Activity.objects.create(
            title="Publicada",
            description="Visivel",
            kind=Activity.Kind.PROVA,
            status=Activity.Status.PUBLISHED,
            total_score=100,
            created_by=self.teacher,
        )
        question = published_activity.questions.create(
            statement="Pergunta",
            type="multipla_escolha",
            weight=100,
            position=1,
            expected_answer="Resposta",
        )
        question.options.create(label="A", position=1, is_correct=True)
        question.options.create(label="B", position=2, is_correct=False)

        list_response = self.client.get(
            reverse("activities"), **self._auth(self.student_session)
        )
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 1)
        self.assertEqual(list_response.json()[0]["id"], str(published_activity.id))

        detail_response = self.client.get(
            reverse("activity-item", args=[published_activity.id]),
            **self._auth(self.student_session),
        )
        self.assertEqual(detail_response.status_code, 200)
        self.assertNotIn("expectedAnswer", detail_response.json()["questions"][0])
        self.assertNotIn("isCorrect", detail_response.json()["questions"][0]["options"][0])

        hidden_response = self.client.get(
            reverse("activity-item", args=[draft_activity.id]),
            **self._auth(self.student_session),
        )
        self.assertEqual(hidden_response.status_code, 404)

    def test_student_cannot_create_activity(self):
        response = self.client.post(
            reverse("activities"),
            data=json.dumps(
                {
                    "title": "Tentativa",
                    "description": "Nao permitido",
                    "kind": "trabalho",
                    "totalScore": 100,
                }
            ),
            content_type="application/json",
            **self._auth(self.student_session),
        )

        self.assertEqual(response.status_code, 403)


class SubmissionFlowTests(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="teacher-submission",
            email="teacher-submission@example.com",
            password="demo123456",
        )
        self.teacher.profile.role = UserProfile.Role.PROFESSOR
        self.teacher.profile.display_name = "Professor Corretor"
        self.teacher.profile.save()

        self.student = User.objects.create_user(
            username="student-submission",
            email="student-submission@example.com",
            password="demo123456",
        )
        self.student.profile.role = UserProfile.Role.ALUNO
        self.student.profile.display_name = "Aluno Respondente"
        self.student.profile.save()

        self.teacher_session = AuthSession.objects.create(user=self.teacher)
        self.student_session = AuthSession.objects.create(user=self.student)

        self.activity = Activity.objects.create(
            title="Atividade publicada",
            description="Descricao da atividade",
            kind=Activity.Kind.ATIVIDADE,
            status=Activity.Status.PUBLISHED,
            total_score=100,
            created_by=self.teacher,
        )
        self.question = self.activity.questions.create(
            statement="Pergunta 1",
            type="multipla_escolha",
            weight=100,
            position=1,
            expected_answer="Opcao correta",
        )
        self.option_a = self.question.options.create(
            label="Opcao A", position=1, is_correct=True
        )
        self.option_b = self.question.options.create(
            label="Opcao B", position=2, is_correct=False
        )

    def _auth(self, session: AuthSession) -> dict[str, str]:
        return {"HTTP_AUTHORIZATION": f"Token {session.key}"}

    def test_student_can_save_and_confirm_single_submission(self):
        save_response = self.client.post(
            reverse("activity-submissions", args=[self.activity.id]),
            data=json.dumps(
                {
                    "answers": [
                        {
                            "questionId": str(self.question.id),
                            "selectedOptionId": str(self.option_a.id),
                        }
                    ]
                }
            ),
            content_type="application/json",
            **self._auth(self.student_session),
        )
        self.assertEqual(save_response.status_code, 201)
        submission_id = save_response.json()["id"]
        self.assertEqual(save_response.json()["status"], "in_progress")

        confirm_response = self.client.post(
            reverse("submission-confirm", args=[submission_id]),
            **self._auth(self.student_session),
        )
        self.assertEqual(confirm_response.status_code, 200)
        self.assertEqual(confirm_response.json()["status"], "submitted")
        self.assertIsNotNone(confirm_response.json()["submittedAt"])

        edit_again_response = self.client.post(
            reverse("activity-submissions", args=[self.activity.id]),
            data=json.dumps(
                {
                    "answers": [
                        {
                            "questionId": str(self.question.id),
                            "selectedOptionId": str(self.option_b.id),
                        }
                    ]
                }
            ),
            content_type="application/json",
            **self._auth(self.student_session),
        )
        self.assertEqual(edit_again_response.status_code, 400)

    def test_teacher_can_review_submission(self):
        submission = Submission.objects.create(
            activity=self.activity,
            student=self.student,
            status=Submission.Status.SUBMITTED,
        )

        review_response = self.client.post(
            reverse("submission-review", args=[submission.id]),
            data=json.dumps({"score": 85, "comment": "Bom trabalho"}),
            content_type="application/json",
            **self._auth(self.teacher_session),
        )

        self.assertEqual(review_response.status_code, 200)
        self.assertEqual(review_response.json()["status"], "reviewed")
        self.assertEqual(review_response.json()["score"], 85)
        self.assertEqual(review_response.json()["feedback"], "Bom trabalho")
        self.assertTrue(Review.objects.filter(submission=submission, score=85).exists())

    def test_work_review_requires_comment(self):
        work_activity = Activity.objects.create(
            title="Trabalho publicado",
            description="Entregar arquivo",
            kind=Activity.Kind.TRABALHO,
            status=Activity.Status.PUBLISHED,
            total_score=100,
            created_by=self.teacher,
        )
        submission = Submission.objects.create(
            activity=work_activity,
            student=self.student,
            status=Submission.Status.SUBMITTED,
        )
        submission.files.create(
            file_name="entrega.pdf",
            file_url="https://example.com/entrega.pdf",
            file_type="pdf",
        )

        review_response = self.client.post(
            reverse("submission-review", args=[submission.id]),
            data=json.dumps({"score": 90, "comment": ""}),
            content_type="application/json",
            **self._auth(self.teacher_session),
        )

        self.assertEqual(review_response.status_code, 400)

    def test_student_current_submission_endpoint_returns_submission(self):
        submission = Submission.objects.create(
            activity=self.activity,
            student=self.student,
            status=Submission.Status.IN_PROGRESS,
        )
        submission.answers.create(
            question=self.question,
            selected_option=self.option_b,
        )

        response = self.client.get(
            reverse("current-submission", args=[self.activity.id]),
            **self._auth(self.student_session),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], str(submission.id))


class ContentAndCalendarFlowTests(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="teacher-content",
            email="teacher-content@example.com",
            password="demo123456",
        )
        self.teacher.profile.role = UserProfile.Role.PROFESSOR
        self.teacher.profile.display_name = "Professor Conteudo"
        self.teacher.profile.save()

        self.student = User.objects.create_user(
            username="student-content",
            email="student-content@example.com",
            password="demo123456",
        )
        self.student.profile.role = UserProfile.Role.ALUNO
        self.student.profile.display_name = "Aluno Conteudo"
        self.student.profile.save()

        self.teacher_session = AuthSession.objects.create(user=self.teacher)
        self.student_session = AuthSession.objects.create(user=self.student)

    def _auth(self, session: AuthSession) -> dict[str, str]:
        return {"HTTP_AUTHORIZATION": f"Token {session.key}"}

    def test_professor_can_create_and_publish_content(self):
        upload_response = self.client.post(
            reverse("media-upload"),
            data={
                "kind": "content_image",
                "file": SimpleUploadedFile(
                    "conteudo.png",
                    b"content-image",
                    content_type="image/png",
                ),
            },
            **self._auth(self.teacher_session),
        )
        self.assertEqual(upload_response.status_code, 201)

        create_response = self.client.post(
            reverse("contents"),
            data=json.dumps(
                {
                    "title": "Aula 1",
                    "subtitle": "Introducao",
                    "description": "Conteudo inicial",
                    "imageUrl": upload_response.json()["url"],
                }
            ),
            content_type="application/json",
            **self._auth(self.teacher_session),
        )
        self.assertEqual(create_response.status_code, 201)
        content_id = create_response.json()["id"]

        publish_response = self.client.patch(
            reverse("content-item", args=[content_id]),
            data=json.dumps({"status": "published"}),
            content_type="application/json",
            **self._auth(self.teacher_session),
        )
        self.assertEqual(publish_response.status_code, 200)
        self.assertEqual(publish_response.json()["status"], "published")
        self.assertTrue(Content.objects.get(pk=content_id).published_at is not None)

    def test_student_only_sees_published_content(self):
        draft = Content.objects.create(
            title="Draft",
            subtitle="Oculto",
            description="Nao publicado",
            author=self.teacher,
        )
        published = Content.objects.create(
            title="Publicado",
            subtitle="Visivel",
            description="Disponivel",
            author=self.teacher,
            status=Content.Status.PUBLISHED,
            published_at=timezone.now(),
        )

        list_response = self.client.get(
            reverse("contents"), **self._auth(self.student_session)
        )
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 1)
        self.assertEqual(list_response.json()[0]["id"], str(published.id))

        hidden_detail = self.client.get(
            reverse("content-item", args=[draft.id]),
            **self._auth(self.student_session),
        )
        self.assertEqual(hidden_detail.status_code, 404)

    def test_calendar_events_include_activity_due_dates_and_manual_events(self):
        Activity.objects.create(
            title="Atividade com prazo",
            description="Descricao",
            kind=Activity.Kind.ATIVIDADE,
            status=Activity.Status.PUBLISHED,
            due_at=timezone.now(),
            total_score=100,
            created_by=self.teacher,
        )
        CalendarEvent.objects.create(
            title="Reuniao",
            description="Evento manual",
            type=CalendarEvent.Type.OTHER,
            start_at=timezone.now(),
            created_by=self.teacher,
        )

        response = self.client.get(
            reverse("calendar-events"), **self._auth(self.student_session)
        )
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 2)
        event_types = {item["type"] for item in response.json()}
        self.assertIn("delivery_atividade", event_types)
        self.assertIn("other", event_types)

    def test_student_can_create_personal_note_visible_only_to_self(self):
        create_response = self.client.post(
            reverse("calendar-notes"),
            data=json.dumps(
                {
                    "title": "Estudar",
                    "description": "Revisar conteudo",
                    "startAt": timezone.now().isoformat(),
                }
            ),
            content_type="application/json",
            **self._auth(self.student_session),
        )
        self.assertEqual(create_response.status_code, 201)
        note_id = create_response.json()["id"]
        self.assertTrue(
            PersonalCalendarNote.objects.filter(pk=note_id, student=self.student).exists()
        )

        teacher_list = self.client.get(
            reverse("calendar-notes"), **self._auth(self.teacher_session)
        )
        self.assertEqual(teacher_list.status_code, 403)


class ProfileAndCommunityFlowTests(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="teacher-community",
            email="teacher-community@example.com",
            password="demo123456",
        )
        self.teacher.profile.role = UserProfile.Role.PROFESSOR
        self.teacher.profile.display_name = "Professor Comunidade"
        self.teacher.profile.save()

        self.student = User.objects.create_user(
            username="student-community",
            email="student-community@example.com",
            password="demo123456",
        )
        self.student.profile.role = UserProfile.Role.ALUNO
        self.student.profile.display_name = "Aluno Comunidade"
        self.student.profile.save()

        self.teacher_session = AuthSession.objects.create(user=self.teacher)
        self.student_session = AuthSession.objects.create(user=self.student)

    def _auth(self, session: AuthSession) -> dict[str, str]:
        return {"HTTP_AUTHORIZATION": f"Token {session.key}"}

    def test_profile_can_be_updated(self):
        response = self.client.patch(
            reverse("profile-item"),
            data=json.dumps(
                {
                    "displayName": "Aluno Atualizado",
                    "preferences": {"theme": "dark"},
                    "bio": "",
                }
            ),
            content_type="application/json",
            **self._auth(self.student_session),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["displayName"], "Aluno Atualizado")
        self.assertEqual(response.json()["preferences"]["theme"], "dark")

    def test_student_post_requires_approval_to_enter_student_feed(self):
        create_response = self.client.post(
            reverse("community-posts"),
            data=json.dumps(
                {
                    "audience": "alunos",
                    "title": "Meu post",
                    "body": "Conteudo do aluno",
                }
            ),
            content_type="application/json",
            **self._auth(self.student_session),
        )
        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.json()["status"], "pending_review")
        post_id = create_response.json()["id"]

        student_feed_before = self.client.get(
            reverse("community-posts"), **self._auth(self.student_session)
        )
        self.assertEqual(student_feed_before.status_code, 200)
        self.assertEqual(len(student_feed_before.json()), 0)

        own_posts = self.client.get(
            f"{reverse('community-posts')}?scope=mine",
            **self._auth(self.student_session),
        )
        self.assertEqual(own_posts.status_code, 200)
        self.assertEqual(len(own_posts.json()), 1)
        self.assertEqual(own_posts.json()[0]["status"], "pending_review")

        moderation_queue = self.client.get(
            f"{reverse('community-posts')}?queue=moderation",
            **self._auth(self.teacher_session),
        )
        self.assertEqual(moderation_queue.status_code, 200)
        self.assertEqual(len(moderation_queue.json()), 1)

        approve_response = self.client.post(
            reverse("community-post-approve", args=[post_id]),
            data=json.dumps({"comment": "Aprovado"}),
            content_type="application/json",
            **self._auth(self.teacher_session),
        )
        self.assertEqual(approve_response.status_code, 200)
        self.assertEqual(approve_response.json()["status"], "approved")

        student_feed_after = self.client.get(
            reverse("community-posts"), **self._auth(self.student_session)
        )
        self.assertEqual(student_feed_after.status_code, 200)
        self.assertEqual(len(student_feed_after.json()), 1)

    def test_teacher_feed_is_private_to_professors(self):
        create_response = self.client.post(
            reverse("community-posts"),
            data=json.dumps(
                {
                    "audience": "professores",
                    "title": "Aviso interno",
                    "body": "Somente professores",
                }
            ),
            content_type="application/json",
            **self._auth(self.teacher_session),
        )
        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.json()["status"], "approved")

        teacher_feed = self.client.get(
            reverse("community-posts"), **self._auth(self.teacher_session)
        )
        self.assertEqual(teacher_feed.status_code, 200)
        self.assertEqual(len(teacher_feed.json()), 1)

        student_feed = self.client.get(
            reverse("community-posts"), **self._auth(self.student_session)
        )
        self.assertEqual(student_feed.status_code, 200)
        self.assertEqual(len(student_feed.json()), 0)

    def test_teacher_can_reject_student_post(self):
        post = CommunityPost.objects.create(
            author=self.student,
            audience=CommunityPost.Audience.ALUNOS,
            title="Post pendente",
            body="Aguardando moderacao",
            status=CommunityPost.Status.PENDING_REVIEW,
        )

        reject_response = self.client.post(
            reverse("community-post-reject", args=[post.id]),
            data=json.dumps({"comment": "Precisa ajustar o conteudo"}),
            content_type="application/json",
            **self._auth(self.teacher_session),
        )

        self.assertEqual(reject_response.status_code, 200)
        self.assertEqual(reject_response.json()["status"], "rejected")


class HomeSummaryFlowTests(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="teacher-home",
            email="teacher-home@example.com",
            password="demo123456",
        )
        self.teacher.profile.role = UserProfile.Role.PROFESSOR
        self.teacher.profile.display_name = "Professor Home"
        self.teacher.profile.save()

        self.other_teacher = User.objects.create_user(
            username="teacher-home-2",
            email="teacher-home-2@example.com",
            password="demo123456",
        )
        self.other_teacher.profile.role = UserProfile.Role.PROFESSOR
        self.other_teacher.profile.display_name = "Outro Professor"
        self.other_teacher.profile.save()

        self.student = User.objects.create_user(
            username="student-home",
            email="student-home@example.com",
            password="demo123456",
        )
        self.student.profile.role = UserProfile.Role.ALUNO
        self.student.profile.display_name = "Aluno Home"
        self.student.profile.save()

        self.teacher_session = AuthSession.objects.create(user=self.teacher)
        self.student_session = AuthSession.objects.create(user=self.student)

    def _auth(self, session: AuthSession) -> dict[str, str]:
        return {"HTTP_AUTHORIZATION": f"Token {session.key}"}

    def test_student_home_summary_returns_recent_posts_and_upcoming_items(self):
        now = timezone.now()
        approved_posts = []
        for index in range(4):
            post = CommunityPost.objects.create(
                author=self.student,
                audience=CommunityPost.Audience.ALUNOS,
                title=f"Post {index + 1}",
                body=f"Conteúdo {index + 1}",
                status=CommunityPost.Status.APPROVED,
            )
            CommunityPost.objects.filter(pk=post.pk).update(
                created_at=now - timedelta(hours=(4 - index))
            )
            approved_posts.append(post)

        CommunityPost.objects.create(
            author=self.student,
            audience=CommunityPost.Audience.ALUNOS,
            title="Post pendente",
            body="Não deve entrar",
            status=CommunityPost.Status.PENDING_REVIEW,
        )

        CalendarEvent.objects.create(
            title="Aula ao vivo",
            description="Evento futuro",
            type=CalendarEvent.Type.OTHER,
            start_at=now + timedelta(hours=2),
            created_by=self.teacher,
        )
        CalendarEvent.objects.create(
            title="Evento antigo",
            description="Passado",
            type=CalendarEvent.Type.OTHER,
            start_at=now - timedelta(days=1),
            created_by=self.teacher,
        )
        Activity.objects.create(
            title="Tarefa publicada",
            description="Entrega importante",
            kind=Activity.Kind.ATIVIDADE,
            status=Activity.Status.PUBLISHED,
            due_at=now + timedelta(days=1),
            total_score=100,
            created_by=self.teacher,
        )
        Activity.objects.create(
            title="Rascunho oculto",
            description="Não deve entrar",
            kind=Activity.Kind.PROVA,
            status=Activity.Status.DRAFT,
            due_at=now + timedelta(minutes=30),
            total_score=100,
            created_by=self.teacher,
        )
        PersonalCalendarNote.objects.create(
            student=self.student,
            title="Revisar capítulo",
            description="Nota pessoal futura",
            start_at=now + timedelta(hours=1),
        )
        PersonalCalendarNote.objects.create(
            student=self.student,
            title="Nota antiga",
            description="Passado",
            start_at=now - timedelta(hours=1),
        )

        response = self.client.get(
            reverse("student-home-summary"), **self._auth(self.student_session)
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual([item["title"] for item in payload["recentPosts"]], ["Post 4", "Post 3", "Post 2"])
        self.assertEqual(len(payload["upcomingItems"]), 3)
        self.assertEqual(
            [item["title"] for item in payload["upcomingItems"]],
            ["Revisar capítulo", "Aula ao vivo", "Prazo: Tarefa publicada"],
        )
        self.assertEqual(payload["upcomingItems"][0]["source"], "personal_note")
        self.assertEqual(payload["upcomingItems"][2]["eventType"], "delivery_atividade")

    def test_teacher_home_summary_returns_recent_contents_and_pending_reviews(self):
        now = timezone.now()
        recent_content_ids = []
        for index in range(4):
            content = Content.objects.create(
                title=f"Conteúdo {index + 1}",
                subtitle="Resumo",
                description="Descrição",
                author=self.teacher,
                status=Content.Status.PUBLISHED if index != 1 else Content.Status.DRAFT,
                published_at=None if index == 1 else now - timedelta(hours=index + 1),
            )
            if index == 1:
                Content.objects.filter(pk=content.pk).update(
                    created_at=now - timedelta(hours=2, minutes=30)
                )
            recent_content_ids.append(str(content.id))

        Content.objects.create(
            title="Conteúdo de outro professor",
            subtitle="Externo",
            description="Descrição",
            author=self.other_teacher,
            status=Content.Status.PUBLISHED,
            published_at=now,
        )

        activity = Activity.objects.create(
            title="Tarefa para corrigir",
            description="Descrição",
            kind=Activity.Kind.ATIVIDADE,
            status=Activity.Status.PUBLISHED,
            total_score=100,
            created_by=self.teacher,
        )
        other_activity = Activity.objects.create(
            title="Tarefa alheia",
            description="Descrição",
            kind=Activity.Kind.ATIVIDADE,
            status=Activity.Status.PUBLISHED,
            total_score=100,
            created_by=self.other_teacher,
        )

        expected_titles = []
        for index in range(6):
            student = User.objects.create_user(
                username=f"student-review-{index}",
                email=f"student-review-{index}@example.com",
                password="demo123456",
            )
            student.profile.role = UserProfile.Role.ALUNO
            student.profile.display_name = f"Aluno {index + 1}"
            student.profile.save()

            submission = Submission.objects.create(
                activity=activity,
                student=student,
                status=Submission.Status.SUBMITTED,
                submitted_at=now - timedelta(hours=6 - index),
            )
            if index < 5:
                expected_titles.append(student.profile.display_name)

        foreign_student = User.objects.create_user(
            username="student-review-foreign",
            email="student-review-foreign@example.com",
            password="demo123456",
        )
        foreign_student.profile.role = UserProfile.Role.ALUNO
        foreign_student.profile.display_name = "Aluno Externo"
        foreign_student.profile.save()
        Submission.objects.create(
            activity=other_activity,
            student=foreign_student,
            status=Submission.Status.SUBMITTED,
            submitted_at=now - timedelta(days=1),
        )
        reviewed_submission = Submission.objects.create(
            activity=activity,
            student=self.student,
            status=Submission.Status.REVIEWED,
            submitted_at=now - timedelta(days=2),
        )
        Review.objects.create(
            submission=reviewed_submission,
            reviewed_by=self.teacher,
            score=90,
            comment="Corrigido",
        )

        response = self.client.get(
            reverse("teacher-home-summary"), **self._auth(self.teacher_session)
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(
            [item["id"] for item in payload["recentContents"]],
            recent_content_ids[:3],
        )
        self.assertEqual(len(payload["pendingReviews"]), 5)
        self.assertEqual(
            [item["studentName"] for item in payload["pendingReviews"]],
            expected_titles,
        )
        self.assertTrue(
            all(item["activityTitle"] == "Tarefa para corrigir" for item in payload["pendingReviews"])
        )


class GamesFlowTests(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="teacher-games",
            email="teacher-games@example.com",
            password="demo123456",
        )
        self.teacher.profile.role = UserProfile.Role.PROFESSOR
        self.teacher.profile.display_name = "Professor Games"
        self.teacher.profile.save()

        self.student = User.objects.create_user(
            username="student-games",
            email="student-games@example.com",
            password="demo123456",
        )
        self.student.profile.role = UserProfile.Role.ALUNO
        self.student.profile.display_name = "Aluno Games"
        self.student.profile.save()

        self.teacher_session = AuthSession.objects.create(user=self.teacher)
        self.student_session = AuthSession.objects.create(user=self.student)

        self.game = Game.objects.get(slug="quiz-matematica")

    def _auth(self, session: AuthSession) -> dict[str, str]:
        return {"HTTP_AUTHORIZATION": f"Token {session.key}"}

    def test_student_lists_published_games(self):
        response = self.client.get(reverse("games"), **self._auth(self.student_session))
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 5)
        self.assertTrue(any(item["slug"] == "forca" for item in payload))
        self.assertTrue(any(item["slug"] == "labirinto" for item in payload))

    def test_teacher_cannot_access_games_catalog(self):
        response = self.client.get(reverse("games"), **self._auth(self.teacher_session))
        self.assertEqual(response.status_code, 403)

    def test_student_can_register_game_session(self):
        response = self.client.post(
            reverse("game-sessions-collection", args=[self.game.id]),
            data=json.dumps({"score": 88, "progress": 60}),
            content_type="application/json",
            **self._auth(self.student_session),
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            GameSession.objects.filter(game=self.game, student=self.student, score=88).exists()
        )

        list_response = self.client.get(
            reverse("game-sessions"), **self._auth(self.student_session)
        )
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 1)
        self.assertEqual(list_response.json()[0]["gameTitle"], "Quiz de Matemática")

    def test_game_detail_includes_student_progress(self):
        GameSession.objects.create(
            game=self.game,
            student=self.student,
            score=70,
            progress=40,
        )
        GameSession.objects.create(
            game=self.game,
            student=self.student,
            score=92,
            progress=100,
        )

        response = self.client.get(
            reverse("game-item", args=[self.game.id]),
            **self._auth(self.student_session),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["bestScore"], 92)
        self.assertEqual(response.json()["lastProgress"], 100)
        self.assertEqual(response.json()["totalSessions"], 2)

    @patch("core.games_runtime._fetch_json")
    def test_student_can_fetch_hangman_runtime(self, fetch_json_mock):
        hangman_game = Game.objects.get(slug="forca")
        fetch_json_mock.return_value = ["caderno"]

        response = self.client.get(
            reverse("game-runtime", args=[hangman_game.id]),
            **self._auth(self.student_session),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["kind"], "hangman")
        self.assertEqual(payload["contentSource"], "remote_api")
        self.assertEqual(payload["payload"]["solutionWord"], "caderno")

    @patch("core.games_runtime._fetch_json")
    def test_math_quiz_runtime_falls_back_to_local_questions(self, fetch_json_mock):
        fetch_json_mock.side_effect = RuntimeError("provider offline")

        response = self.client.get(
            reverse("game-runtime", args=[self.game.id]),
            **self._auth(self.student_session),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["kind"], "quiz_math")
        self.assertEqual(payload["contentSource"], "local_fallback")
        self.assertGreaterEqual(len(payload["payload"]["questions"]), 4)


class LocalMediaFlowTests(TestCase):
    def setUp(self):
        self.temp_media_root = tempfile.mkdtemp()
        self.override = override_settings(MEDIA_ROOT=self.temp_media_root)
        self.override.enable()

        self.teacher = User.objects.create_user(
            username="teacher-media",
            email="teacher-media@example.com",
            password="demo123456",
        )
        self.teacher.profile.role = UserProfile.Role.PROFESSOR
        self.teacher.profile.display_name = "Professor Midia"
        self.teacher.profile.save()

        self.student = User.objects.create_user(
            username="student-media",
            email="student-media@example.com",
            password="demo123456",
        )
        self.student.profile.role = UserProfile.Role.ALUNO
        self.student.profile.display_name = "Aluno Midia"
        self.student.profile.save()

        self.teacher_session = AuthSession.objects.create(user=self.teacher)
        self.student_session = AuthSession.objects.create(user=self.student)

    def tearDown(self):
        self.override.disable()
        shutil.rmtree(self.temp_media_root, ignore_errors=True)
        super().tearDown()

    def _auth(self, session: AuthSession) -> dict[str, str]:
        return {"HTTP_AUTHORIZATION": f"Token {session.key}"}

    def _upload(self, session: AuthSession, *, kind: str, name: str, content: bytes, content_type: str) -> str:
        response = self.client.post(
            reverse("media-upload"),
            data={
                "kind": kind,
                "file": SimpleUploadedFile(name, content, content_type=content_type),
            },
            **self._auth(session),
        )
        self.assertEqual(response.status_code, 201)
        return response.json()["url"]

    def test_uploaded_media_can_be_used_across_wave_8_resources(self):
        avatar_url = self._upload(
            self.student_session,
            kind="avatar",
            name="avatar.png",
            content=b"avatar-bytes",
            content_type="image/png",
        )
        support_image_url = self._upload(
            self.teacher_session,
            kind="activity_support_image",
            name="apoio.png",
            content=b"support-image",
            content_type="image/png",
        )
        content_image_url = self._upload(
            self.teacher_session,
            kind="content_image",
            name="conteudo.png",
            content=b"content-image",
            content_type="image/png",
        )
        community_image_url = self._upload(
            self.student_session,
            kind="community_image",
            name="post.png",
            content=b"community-image",
            content_type="image/png",
        )

        avatar_response = self.client.post(
            reverse("profile-avatar"),
            data=json.dumps({"avatarUrl": avatar_url}),
            content_type="application/json",
            **self._auth(self.student_session),
        )
        self.assertEqual(avatar_response.status_code, 200)
        self.assertEqual(avatar_response.json()["avatarUrl"], avatar_url)

        content_response = self.client.post(
            reverse("contents"),
            data=json.dumps(
                {
                    "title": "Conteudo com midia",
                    "subtitle": "Aula com imagem local",
                    "description": "Descricao",
                    "imageUrl": content_image_url,
                }
            ),
            content_type="application/json",
            **self._auth(self.teacher_session),
        )
        self.assertEqual(content_response.status_code, 201)
        self.assertEqual(content_response.json()["imageUrl"], content_image_url)

        community_response = self.client.post(
            reverse("community-posts"),
            data=json.dumps(
                {
                    "audience": "alunos",
                    "title": "Post com imagem",
                    "body": "Usando midia local",
                    "imageUrl": community_image_url,
                }
            ),
            content_type="application/json",
            **self._auth(self.student_session),
        )
        self.assertEqual(community_response.status_code, 201)
        self.assertEqual(community_response.json()["imageUrl"], community_image_url)

        activity_response = self.client.post(
            reverse("activities"),
            data=json.dumps(
                {
                    "title": "Atividade com apoio",
                    "description": "Descricao",
                    "kind": "atividade",
                    "totalScore": 100,
                    "questions": [
                        {
                            "statement": "Observe a imagem",
                            "type": "dissertativa",
                            "weight": 100,
                            "position": 1,
                            "supportImageUrl": support_image_url,
                            "expectedAnswer": "Resposta",
                            "options": [],
                        }
                    ],
                }
            ),
            content_type="application/json",
            **self._auth(self.teacher_session),
        )
        self.assertEqual(activity_response.status_code, 201)
        self.assertEqual(
            activity_response.json()["questions"][0]["supportImageUrl"],
            support_image_url,
        )

    def test_resource_rejects_arbitrary_external_media_url(self):
        response = self.client.post(
            reverse("contents"),
            data=json.dumps(
                {
                    "title": "Conteudo invalido",
                    "subtitle": "Sem upload",
                    "description": "Descricao",
                    "imageUrl": "https://example.com/image.png",
                }
            ),
            content_type="application/json",
            **self._auth(self.teacher_session),
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "Use um arquivo enviado pela API.")
