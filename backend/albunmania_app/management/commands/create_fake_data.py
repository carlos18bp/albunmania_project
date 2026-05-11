"""Seed deterministic Albunmanía data for local Playwright validation.

Idempotent — every model uses get_or_create / update_or_create. Run as
many times as needed; only the random UserSticker counts will reshuffle
on subsequent runs (the canonical accounts and their inventories stay
predictable enough for the Playwright sessions to assert against).
"""
from datetime import date, datetime, timedelta, timezone as dt_timezone
from decimal import Decimal
import random

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from albunmania_app.models import (
    AdCampaign, AdCreative, Album, Like, Match, MerchantProfile,
    Sponsor, Sticker, Trade, User, UserSticker,
)


class Command(BaseCommand):
    help = 'Create fake data tailored to Albunmanía Playwright validation.'

    def add_arguments(self, parser):
        parser.add_argument('number_of_records', type=int, nargs='?', default=None)
        parser.add_argument('--users', type=int, default=10)

    def handle(self, *args, **options):
        users_count = options['number_of_records'] or options['users']

        self.stdout.write(self.style.SUCCESS('==== Creating Fake Data ===='))

        self.stdout.write(self.style.SUCCESS('\n--- Users + Profiles ---'))
        call_command('create_users', number_of_users=users_count)

        self.stdout.write(self.style.SUCCESS('\n--- Album + Stickers ---'))
        album = self._seed_album()
        stickers = self._seed_stickers(album)

        self.stdout.write(self.style.SUCCESS('\n--- Active album for collectors ---'))
        self._set_active_album(album)

        self.stdout.write(self.style.SUCCESS('\n--- Inventories (cross-stocked) ---'))
        self._seed_inventories(stickers)

        self.stdout.write(self.style.SUCCESS('\n--- Sponsor (Coca-Cola) ---'))
        self._seed_sponsor()

        self.stdout.write(self.style.SUCCESS('\n--- AdCampaign + Creative ---'))
        self._seed_ad_campaign()

        self.stdout.write(self.style.SUCCESS('\n--- MerchantProfile (Papelería El Sol) ---'))
        self._seed_merchant()

        self.stdout.write(self.style.SUCCESS('\n--- Mutual match between user + user2 ---'))
        self._seed_match(stickers)

        self.stdout.write(self.style.SUCCESS('\n==== Fake Data Creation Complete ===='))

    # ---------- factories -------------------------------------------------

    def _seed_album(self) -> Album:
        album, _ = Album.objects.update_or_create(
            slug='mundial-26',
            defaults={
                'name': 'Mundial 26',
                'edition_year': 2026,
                'total_stickers': 670,
                'is_active': True,
                'launch_date': date(2026, 4, 1),
                'cover_image_url': '',
            },
        )
        return album

    def _seed_stickers(self, album: Album) -> list[Sticker]:
        teams = ['Colombia', 'Argentina', 'Brasil', 'México', 'EE.UU.', 'Francia',
                 'España', 'Inglaterra', 'Alemania', 'Japón']
        special_numbers = {'00', '01', '15', '32', '50'}
        stickers: list[Sticker] = []
        for i in range(1, 51):
            number = f'{i:02d}'
            is_special = number in special_numbers
            sticker, _ = Sticker.objects.update_or_create(
                album=album, number=number,
                defaults={
                    'name': f'Jugador #{number}',
                    'team': teams[(i - 1) % len(teams)],
                    'image_url': '',
                    'is_special_edition': is_special,
                    'special_tier': 'gold' if is_special else '',
                    'market_value_estimate': Decimal('15000') if is_special else Decimal('500'),
                },
            )
            stickers.append(sticker)
        return stickers

    def _set_active_album(self, album: Album) -> None:
        for user in User.objects.filter(role=User.Role.COLLECTOR.value):
            profile = user.profile
            if profile.active_album_id != album.id:
                profile.active_album_id = album.id
                profile.save(update_fields=['active_album_id', 'updated_at'])

    def _seed_inventories(self, stickers: list[Sticker]) -> None:
        rng = random.Random(42)  # deterministic across runs
        collectors = list(User.objects.filter(role=User.Role.COLLECTOR.value))
        for user in collectors:
            for sticker in stickers:
                # Tiered distribution per user: ~60% pasted, ~30% repeated, ~10% missing.
                roll = rng.random()
                if user.email == 'user@example.com':
                    # user has many repeats user2 needs
                    count = 2 if roll < 0.5 else (1 if roll < 0.8 else 0)
                elif user.email == 'user2@example.com':
                    # user2 mirrors user — what user has repeated, user2 misses, and vice versa.
                    count = 0 if roll < 0.5 else (1 if roll < 0.7 else 2)
                else:
                    count = 1 if roll < 0.6 else (2 if roll < 0.9 else 0)
                UserSticker.objects.update_or_create(
                    user=user, sticker=sticker, defaults={'count': count},
                )

    def _seed_sponsor(self) -> None:
        Sponsor.objects.update_or_create(
            brand_name='Coca-Cola',
            defaults={
                'logo_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Coca-Cola_logo.svg/240px-Coca-Cola_logo.svg.png',
                'primary_color': '#F40000',
                'secondary_color': '#FFFFFF',
                'message_text': 'Patrocinador oficial del intercambio',
                'active_from': timezone.now() - timedelta(days=1),
                'active_until': timezone.now() + timedelta(days=120),
                'contract_amount': Decimal('250000000'),
            },
        )

    def _seed_ad_campaign(self) -> None:
        admin = User.objects.filter(role=User.Role.ADMIN.value).first()
        if not admin:
            self.stdout.write(self.style.WARNING('  · skipped: no admin user'))
            return
        campaign, _ = AdCampaign.objects.update_or_create(
            advertiser_name='Bavaria',
            defaults={
                'impressions_purchased': 100000,
                'cpm_rate_cop': Decimal('15000'),
                'geo_targeting_cities': '',  # global
                'weight': 1,
                'start_date': date.today() - timedelta(days=2),
                'end_date': date.today() + timedelta(days=60),
                'status': AdCampaign.Status.ACTIVE,
                'created_by': admin,
            },
        )
        AdCreative.objects.update_or_create(
            campaign=campaign,
            click_url='https://example.com/bavaria',
            defaults={
                'image_url': 'https://placehold.co/1200x300/0a0a0a/fff?text=Bavaria+Mundial+26',
                'headline': 'Bavaria · Mundial 26',
                'body': 'Refresca el partido.',
                'weight': 1,
                'is_active': True,
            },
        )

    def _seed_merchant(self) -> None:
        try:
            merchant_user = User.objects.get(email='merchant@example.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('  · skipped: no merchant user'))
            return
        # Signal already creates MerchantProfile for MERCHANT role users.
        profile, _ = MerchantProfile.objects.update_or_create(
            user=merchant_user,
            defaults={
                'business_name': 'Papelería El Sol',
                'business_type': 'papeleria',
                'address': 'Cra 7 # 50-15, Bogotá',
                'lat': Decimal('4.6500'),
                'lng': Decimal('-74.0700'),
                'opening_hours': {
                    'mon': '08:00-18:00', 'tue': '08:00-18:00', 'wed': '08:00-18:00',
                    'thu': '08:00-18:00', 'fri': '08:00-18:00', 'sat': '09:00-14:00',
                },
                'declared_stock': 'Sobres Mundial 26 disponibles. Llegada semanal los miércoles.',
                'subscription_status': 'active',
                'subscription_expires_at': timezone.now() + timedelta(days=30),
            },
        )
        # Make sure the merchant's profile.city matches for the public list filter.
        merchant_user.profile.city = 'Bogotá'
        merchant_user.profile.save(update_fields=['city', 'updated_at'])

    def _seed_match(self, stickers: list[Sticker]) -> None:
        try:
            user = User.objects.get(email='user@example.com')
            user2 = User.objects.get(email='user2@example.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('  · skipped: missing canonical collectors'))
            return

        a_id, b_id = (user.id, user2.id) if user.id < user2.id else (user2.id, user.id)
        match, _ = Match.objects.update_or_create(
            user_a_id=a_id, user_b_id=b_id, channel=Match.Channel.SWIPE,
            defaults={'status': Match.Status.MUTUAL},
        )

        # Pick first sticker user has repeated and user2 is missing, and vice versa.
        give = next(
            (s for s in stickers if UserSticker.objects.filter(user=user, sticker=s, count__gte=2).exists()
             and UserSticker.objects.filter(user=user2, sticker=s, count=0).exists()),
            stickers[0],
        )
        take = next(
            (s for s in stickers if UserSticker.objects.filter(user=user2, sticker=s, count__gte=2).exists()
             and UserSticker.objects.filter(user=user, sticker=s, count=0).exists()),
            stickers[1],
        )
        Like.objects.update_or_create(
            from_user=user, to_user=user2, sticker_offered=give, sticker_wanted=take,
            defaults={},
        )
        Like.objects.update_or_create(
            from_user=user2, to_user=user, sticker_offered=take, sticker_wanted=give,
            defaults={},
        )
        Trade.objects.update_or_create(
            match=match,
            defaults={
                'items': [
                    {'from_user': user.id, 'to_user': user2.id, 'sticker_id': give.id},
                    {'from_user': user2.id, 'to_user': user.id, 'sticker_id': take.id},
                ],
                'status': Trade.Status.OPEN,
            },
        )
