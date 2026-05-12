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
    AdCampaign, AdClick, AdCreative, AdImpression, Album, Like, Match,
    MerchantProfile, MerchantSubscriptionPayment, Notification, Profile,
    PushSubscription, Report, Review, ReviewReport, Sponsor, Sticker, Trade,
    TradeWhatsAppOptIn, User, UserSticker,
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

        self.stdout.write(self.style.SUCCESS('\n--- Mutual match + completed trade (user + user2) ---'))
        trade = self._seed_match(stickers)

        self.stdout.write(self.style.SUCCESS('\n--- Reviews + report on the completed trade ---'))
        self._seed_reviews(trade)

        self.stdout.write(self.style.SUCCESS('\n--- Merchant subscription payments ---'))
        self._seed_merchant_payments()

        self.stdout.write(self.style.SUCCESS('\n--- Ad impressions + clicks (Bavaria campaign) ---'))
        self._seed_ad_impressions()

        self.stdout.write(self.style.SUCCESS('\n--- Push subscriptions (1 per collector, non-routable) ---'))
        self._seed_push_subscriptions()

        self.stdout.write(self.style.SUCCESS('\n--- In-app notifications (canonical collectors) ---'))
        self._seed_notifications()

        self.stdout.write(self.style.SUCCESS('\n--- Moderation report (pending) ---'))
        self._seed_reports(trade)

        self.stdout.write(self.style.SUCCESS('\n--- Presence (canonical collectors online now) ---'))
        self._seed_presence()

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

    def _seed_match(self, stickers: list[Sticker]) -> Trade | None:
        try:
            user = User.objects.get(email='user@example.com')
            user2 = User.objects.get(email='user2@example.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('  · skipped: missing canonical collectors'))
            return None

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
        trade, _ = Trade.objects.update_or_create(
            match=match,
            defaults={
                'items': [
                    {'from_user': user.id, 'to_user': user2.id, 'sticker_id': give.id},
                    {'from_user': user2.id, 'to_user': user.id, 'sticker_id': take.id},
                ],
                'status': Trade.Status.COMPLETED,
            },
        )
        # Reset the per-trade WhatsApp opt-ins to the clean initial state
        # the Playwright session-03 tests expect (neither side opted in).
        # Without this, opt-in rows left over from a previous validation
        # run would make the wa.me link render before the tests opt in.
        TradeWhatsAppOptIn.objects.filter(trade=trade).delete()
        return trade

    # --- new entities surfaced by the new-feature-checklist audit ---------

    def _seed_reviews(self, trade: Trade | None) -> None:
        """Two reviews on the completed trade (one with a public reply) +
        one pending ReviewReport — populates Profile.rating_* aggregates
        (via the post_save signal) and the admin moderation queue.

        Note: TradeWhatsAppOptIn is deliberately NOT seeded — the
        Playwright session-03 WhatsApp tests need trade #1 to start with
        zero opt-in rows so they can exercise the "one side / both sides"
        transitions themselves.
        """
        if trade is None:
            self.stdout.write(self.style.WARNING('  · skipped: no trade'))
            return
        user = User.objects.get(email='user@example.com')
        user2 = User.objects.get(email='user2@example.com')

        r1, _ = Review.objects.update_or_create(
            trade=trade, reviewer=user,
            defaults={
                'reviewee': user2, 'stars': 5,
                'comment': 'Todo perfecto, llegó puntual y los cromos impecables.',
                'tags': ['puntual', 'cromos_buen_estado', 'buena_comunicacion'],
                'reply': '¡Gracias! Un placer intercambiar contigo.',
                'replied_at': timezone.now(),
            },
        )
        Review.objects.update_or_create(
            trade=trade, reviewer=user2,
            defaults={
                'reviewee': user, 'stars': 4,
                'comment': 'Buen intercambio, recomendado.',
                'tags': ['amable', 'ubicacion_facil'],
            },
        )
        # A reporter who is not a party to the trade flags one review.
        reporter = (
            User.objects.filter(role=User.Role.COLLECTOR.value)
            .exclude(email__in=['user@example.com', 'user2@example.com'])
            .first()
            or user2
        )
        ReviewReport.objects.update_or_create(
            review=r1, reporter=reporter,
            defaults={
                'reason': 'La respuesta pública parece spam.',
                'status': ReviewReport.Status.PENDING,
            },
        )

    def _seed_merchant_payments(self) -> None:
        merchant = MerchantProfile.objects.filter(business_name='Papelería El Sol').first()
        admin = User.objects.filter(role=User.Role.ADMIN.value).first()
        if not merchant or not admin:
            self.stdout.write(self.style.WARNING('  · skipped: no merchant/admin'))
            return
        # Idempotent: reset to exactly two payments (this month + last month).
        MerchantSubscriptionPayment.objects.filter(merchant=merchant).delete()
        now = timezone.now()
        for months_ago in (1, 0):
            year, month = now.year, now.month - months_ago
            while month < 1:
                month += 12
                year -= 1
            paid_at = datetime(year, month, 1, 12, 0, tzinfo=dt_timezone.utc)
            MerchantSubscriptionPayment.objects.create(
                merchant=merchant, paid_at=paid_at, registered_by=admin,
                amount_cop=Decimal('200000'), period_months=1, method='nequi',
                reference=f'NQ-{paid_at.strftime("%Y%m")}-001',
            )

    def _seed_ad_impressions(self) -> None:
        creative = AdCreative.objects.filter(headline='Bavaria · Mundial 26').first()
        if not creative:
            self.stdout.write(self.style.WARNING('  · skipped: no Bavaria creative'))
            return
        collectors = list(User.objects.filter(role=User.Role.COLLECTOR.value))
        if not collectors:
            self.stdout.write(self.style.WARNING('  · skipped: no collectors'))
            return
        # Reset to a deterministic 200 impressions + ~5% clicks.
        AdImpression.objects.filter(creative=creative).delete()
        rng = random.Random(43)
        cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla']
        slots = [AdImpression.Slot.HOME, AdImpression.Slot.FEED]
        impressions = [
            AdImpression(
                creative=creative,
                user=rng.choice(collectors),
                slot=rng.choice(slots),
                city=rng.choice(cities),
            )
            for _ in range(200)
        ]
        AdImpression.objects.bulk_create(impressions)
        served = list(AdImpression.objects.filter(creative=creative))
        for imp in rng.sample(served, k=min(10, len(served))):
            AdClick.objects.create(impression=imp)

    def _seed_push_subscriptions(self) -> None:
        """One non-routable subscription per collector — lets the admin
        panel show a device count. A real send would fail cleanly because
        push_notify swallows errors and prunes 404/410 endpoints.
        """
        for user in User.objects.filter(role=User.Role.COLLECTOR.value):
            PushSubscription.objects.update_or_create(
                endpoint=f'https://push.example.invalid/seed-{user.id}',
                defaults={
                    'user': user,
                    'p256dh': 'seed-p256dh-key',
                    'auth': 'seed-auth-secret',
                    'user_agent': 'Mozilla/5.0 (seed)',
                },
            )

    def _seed_notifications(self) -> None:
        """A few in-app notifications for the canonical collectors so the
        /notificaciones center and the Header bell badge aren't empty.
        Idempotent: reset to a fixed set each run.
        """
        try:
            user = User.objects.get(email='user@example.com')
            user2 = User.objects.get(email='user2@example.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('  · skipped: missing canonical collectors'))
            return
        Notification.objects.filter(user__in=[user, user2]).delete()
        match = Match.objects.filter(
            user_a_id=min(user.id, user2.id), user_b_id=max(user.id, user2.id), channel=Match.Channel.SWIPE,
        ).first()
        now = timezone.now()
        # user: one unread match notification + one read review notification.
        Notification.objects.create(
            user=user, kind=Notification.Kind.MATCH_MUTUAL,
            title='¡Match en Albunmanía!', body=f'{user2.email} también quiere intercambiar contigo.',
            url=f'/match/{match.id}' if match else '/match', actor=user2, match=match,
        )
        Notification.objects.create(
            user=user, kind=Notification.Kind.REVIEW_RECEIVED,
            title='Recibiste una reseña', body=f'{user2.email} te calificó con 4★.',
            url='/profile/me', actor=user2, read_at=now - timedelta(days=1),
        )
        # user2: one unread match notification.
        Notification.objects.create(
            user=user2, kind=Notification.Kind.MATCH_MUTUAL,
            title='¡Match en Albunmanía!', body=f'{user.email} también quiere intercambiar contigo.',
            url=f'/match/{match.id}' if match else '/match', actor=user, match=match,
        )

    def _seed_reports(self, trade: 'Trade | None') -> None:
        """One pending moderation report (trade no-show) so the
        /admin/moderation general-reports queue isn't empty. Idempotent.
        """
        if trade is None:
            self.stdout.write(self.style.WARNING('  · skipped: no trade'))
            return
        user = User.objects.get(email='user@example.com')
        Report.objects.filter(target_trade=trade).delete()
        Report.objects.create(
            reporter=user,
            target_kind=Report.TargetKind.TRADE,
            target_trade=trade,
            reason=Report.Reason.NO_SHOW,
            detail='El otro coleccionista no apareció en el punto acordado.',
            status=Report.Status.PENDING,
        )

    def _seed_presence(self) -> None:
        """Mark the two canonical collectors as active "now" so the Live
        Badge / active-collectors banner render in dev and E2E. Idempotent.
        """
        Profile.objects.filter(
            user__email__in=['user@example.com', 'user2@example.com'],
        ).update(last_seen=timezone.now())
