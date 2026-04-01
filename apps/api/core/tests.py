from django.test import TestCase
from django.urls import reverse


class ApiEndpointsTests(TestCase):
    def test_healthcheck_endpoint(self):
        response = self.client.get(reverse("healthcheck"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_api_info_endpoint(self):
        response = self.client.get(reverse("api-info"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "REMA API")
