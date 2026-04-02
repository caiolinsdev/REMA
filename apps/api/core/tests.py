import json

from django.contrib.auth.models import User
from django.test import TestCase
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
        create_response = self.client.post(
            reverse("contents"),
            data=json.dumps(
                {
                    "title": "Aula 1",
                    "subtitle": "Introducao",
                    "description": "Conteudo inicial",
                    "imageUrl": "https://example.com/image.png",
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

        self.game = Game.objects.get(slug="quiz-fracoes")

    def _auth(self, session: AuthSession) -> dict[str, str]:
        return {"HTTP_AUTHORIZATION": f"Token {session.key}"}

    def test_student_lists_published_games(self):
        response = self.client.get(reverse("games"), **self._auth(self.student_session))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(item["title"] == "Quiz de Fracoes" for item in response.json()))

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
        self.assertEqual(list_response.json()[0]["gameTitle"], "Quiz de Fracoes")

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
