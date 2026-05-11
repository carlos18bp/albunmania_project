from django.core.management.base import BaseCommand, CommandError

from albunmania_app.models import User


class Command(BaseCommand):
    help = 'Delete fake records from the database'

    """
    To delete fake data via console, run:
    python3 manage.py delete_fake_data --confirm

    Note: This command will NOT delete superusers or admin users to protect
    system administrators.

    Albunmanía-specific deletions (Album, Sticker, Match, Trade, Review, etc.)
    will be added here as their epics land in Bloque B.
    """

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of all fake data.',
        )

    def handle(self, *args, **options):
        if not options.get('confirm'):
            raise CommandError('Deletion not confirmed. Re-run with --confirm.')

        self.stdout.write(self.style.SUCCESS('==== Deleting Fake Data ===='))

        self.stdout.write(self.style.SUCCESS('\n--- Deleting non-admin Users ---'))
        users_to_delete = User.objects.filter(is_superuser=False, is_staff=False)
        user_count = users_to_delete.count()
        protected_count = (
            User.objects.filter(is_superuser=True).count()
            + User.objects.filter(is_staff=True, is_superuser=False).count()
        )

        for user in users_to_delete:
            user.delete()

        self.stdout.write(self.style.SUCCESS(f'{user_count} Users deleted'))
        self.stdout.write(
            self.style.WARNING(
                f'{protected_count} Admin/Superuser accounts protected and not deleted'
            )
        )

        self.stdout.write(self.style.SUCCESS('\n==== Fake Data Deletion Complete ===='))
