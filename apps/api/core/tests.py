import json

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from core.models import Activity, AuthSession, Review, Submission, UserProfile


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
