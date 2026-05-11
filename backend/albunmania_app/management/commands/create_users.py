from decimal import Decimal

from django.core.management.base import BaseCommand
from faker import Faker

from albunmania_app.models import User


# Bogotá bounding box approx (lat: 4.45..4.83, lng: -74.20..-74.00)
BOGOTA_LAT_MIN, BOGOTA_LAT_MAX = 4.55, 4.80
BOGOTA_LNG_MIN, BOGOTA_LNG_MAX = -74.18, -74.02


class Command(BaseCommand):
    """Create deterministic Albunmanía users for local validation.

    Always seeds the four canonical accounts the Playwright validation
    sessions rely on (collector, second collector for mutual swipes,
    merchant, admin) and then fills the rest with random collectors
    until `number_of_users` is reached. Existing users are reused via
    `update_or_create` — the command is idempotent and safe to re-run.
    """

    help = 'Create User records for Albunmanía local seed.'

    def add_arguments(self, parser):
        parser.add_argument('number_of_users', type=int, nargs='?', default=10)

    def handle(self, *args, **options):
        number_of_users = options['number_of_users']
        fake = Faker()

        canonical_accounts = [
            ('user@example.com', 'Lucía', 'Rojas', User.Role.COLLECTOR, False),
            ('user2@example.com', 'Camilo', 'Pérez', User.Role.COLLECTOR, False),
            ('merchant@example.com', 'Papelería', 'El Sol', User.Role.MERCHANT, False),
            ('admin@example.com', 'Albun', 'Admin', User.Role.ADMIN, True),
        ]

        users_created = []
        for email, first, last, role, is_staff in canonical_accounts:
            user, _ = User.objects.update_or_create(
                email=email,
                defaults={
                    'first_name': first,
                    'last_name': last,
                    'role': role,
                    'is_staff': is_staff,
                    'is_active': True,
                },
            )
            user.set_password('password123')
            user.save()
            user.assign_role(role)  # also wires Group membership
            users_created.append(user)
            self.stdout.write(self.style.SUCCESS(f'  · {email} ({role})'))

        # Fill the remaining slots with extra collectors (Bogotá geo).
        remaining = max(0, number_of_users - len(canonical_accounts))
        for i in range(remaining):
            email = f'collector{i + 1}@example.com'
            user, _ = User.objects.update_or_create(
                email=email,
                defaults={
                    'first_name': fake.first_name(),
                    'last_name': fake.last_name(),
                    'role': User.Role.COLLECTOR,
                    'is_active': True,
                },
            )
            user.set_password('password123')
            user.save()
            users_created.append(user)
            self.stdout.write(self.style.SUCCESS(f'  · {email} (collector)'))

        # Populate Profile geo + city for the canonical collectors so the
        # Match feed has predictable candidates.
        for user in users_created:
            if user.role != User.Role.COLLECTOR.value:
                continue
            profile = user.profile
            if not profile.lat_approx:
                profile.lat_approx = Decimal(str(round(fake.pyfloat(
                    min_value=BOGOTA_LAT_MIN, max_value=BOGOTA_LAT_MAX,
                ), 6)))
                profile.lng_approx = Decimal(str(round(fake.pyfloat(
                    min_value=BOGOTA_LNG_MIN, max_value=BOGOTA_LNG_MAX,
                ), 6)))
                profile.city = 'Bogotá'
                profile.browser_geo_optin = True
                profile.save()

        self.stdout.write(self.style.SUCCESS(
            f'\nTotal users: {User.objects.count()}'
        ))
