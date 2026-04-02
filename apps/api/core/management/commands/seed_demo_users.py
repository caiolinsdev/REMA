from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from core.models import UserProfile


class Command(BaseCommand):
    help = "Cria usuarios de demonstracao aluno@demo.local e professor@demo.local (senha demo123)."

    def handle(self, *args, **options):
        demos = [
            (
                "aluno@demo.local",
                "Aluno Demo",
                UserProfile.Role.ALUNO,
            ),
            (
                "professor@demo.local",
                "Professor Demo",
                UserProfile.Role.PROFESSOR,
            ),
        ]
        for email, display_name, role in demos:
            user, created = User.objects.get_or_create(
                username=email,
                defaults={
                    "email": email,
                    "first_name": display_name.split()[0],
                    "last_name": " ".join(display_name.split()[1:]) or "",
                },
            )
            if created:
                user.set_password("demo123")
            if user.email != email:
                user.email = email
            user.save()
            profile = user.profile
            profile.role = role
            profile.display_name = display_name
            profile.save()
            action = "criado" if created else "atualizado"
            self.stdout.write(self.style.SUCCESS(f"{email} {action} ({role})"))
