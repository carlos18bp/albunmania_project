"""Heavy seed for Albunmanía dev environments.

Goal: cover EVERY model with realistic volumes (≈100 collectors, full
670-sticker Mundial 26 catalogue, dozens of matches/trades/reviews,
moderation queue, ad rotation, presence distribution) while respecting
all business rules (Match canonical order, Review-after-Trade,
Profile reputation aggregates synced via post_save signal, etc.).

Idempotent: re-runnable without duplicating rows. Pass --reset to wipe
seed data first.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone as dt_timezone
from decimal import Decimal
from pathlib import Path
import json
import random

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker

from albunmania_app.models import (
    AdCampaign, AdClick, AdCreative, AdImpression, Album, Like, Match,
    MerchantProfile, MerchantSubscriptionPayment, Notification, Profile,
    PushSubscription, Report, Review, ReviewReport, Sponsor, Sticker, Trade,
    TradeWhatsAppOptIn, User, UserSticker,
)


# --- 5 Colombian cities for collector + merchant geo distribution -----
CITIES = [
    {'name': 'Bogotá',       'lat': 4.7110,  'lng': -74.0721},
    {'name': 'Medellín',     'lat': 6.2442,  'lng': -75.5812},
    {'name': 'Cali',         'lat': 3.4516,  'lng': -76.5320},
    {'name': 'Barranquilla', 'lat': 10.9685, 'lng': -74.7813},
    {'name': 'Bucaramanga',  'lat': 7.1193,  'lng': -73.1227},
]

# Realistic-sounding Colombian advertisers for AdCampaigns.
ADVERTISERS = [
    'Postobón', 'Bavaria', 'Tigo', 'Bancolombia', 'Avianca',
    'Falabella', 'Movistar', 'Davivienda', 'Rappi', 'Claro',
]

REVIEW_TAGS_POSITIVE = ['puntual', 'cromos_buen_estado', 'buena_comunicacion', 'amable', 'ubicacion_facil']
REVIEW_TAGS_NEGATIVE = ['no_show', 'cromos_dañados', 'mala_comunicacion', 'tarde']


class Command(BaseCommand):
    help = 'Seed Albunmanía dev with heavy, business-rule-respecting fake data.'

    def add_arguments(self, parser):
        parser.add_argument('--collectors', type=int, default=100, help='Number of collector users (default 100).')
        parser.add_argument('--merchants', type=int, default=5, help='Number of merchant users (default 5).')
        parser.add_argument('--matches', type=int, default=50, help='Mutual matches between random collector pairs (default 50).')
        parser.add_argument('--trades-completed', type=int, default=30)
        parser.add_argument('--trades-open', type=int, default=10)
        parser.add_argument('--trades-cancelled', type=int, default=5)
        parser.add_argument('--ad-impressions', type=int, default=3000)
        parser.add_argument('--reset', action='store_true', help='Delete seed data before re-creating.')
        parser.add_argument('--skip-impressions', action='store_true', help='Skip ad impressions (much faster).')

    @transaction.atomic
    def handle(self, *args, **options):
        if options['reset']:
            self._reset()

        rng = random.Random(42)  # deterministic
        fake = Faker('es_CO')
        Faker.seed(42)

        self._announce('Album + 670-sticker Mundial 26 catalogue (from fixture)')
        catalogue = self._load_catalogue()
        album = self._seed_album(catalogue)
        stickers = self._seed_stickers(album, catalogue)

        self._announce(f"Users — {options['collectors']} collectors + {options['merchants']} merchants + 1 admin")
        collectors, merchants, admin = self._seed_users(
            options['collectors'], options['merchants'], rng, fake,
        )

        self._announce('Profiles — geo, city, WhatsApp opt-in, active album')
        self._seed_profiles(collectors, merchants, album, rng, fake)

        self._announce('Merchant profiles + 6-month subscription history')
        self._seed_merchant_profiles_and_payments(merchants, admin, rng)

        self._announce(f'Inventories — ~{len(collectors)*250} UserSticker rows (60/25/15 distribution)')
        self._seed_inventories(collectors, stickers, rng)

        self._announce(f"Matches — {options['matches']} mutual + ~30 open between random collector pairs")
        matches_mutual, matches_open = self._seed_matches(collectors, stickers, options['matches'], rng)

        self._announce(f"Trades — {options['trades_completed']} completed + {options['trades_open']} open + {options['trades_cancelled']} cancelled")
        completed_trades = self._seed_trades(
            matches_mutual, options['trades_completed'], options['trades_open'], options['trades_cancelled'], rng,
        )

        self._announce(f'Reviews — ~50 (mostly positive, some 1-2★) on the {len(completed_trades)} completed trades')
        reviews_low = self._seed_reviews(completed_trades, rng)

        self._announce('ReviewReports — 8 (5 pending + 2 dismissed + 1 actioned) on low-star reviews')
        self._seed_review_reports(reviews_low, collectors, admin, rng)

        self._announce('Reports (moderation) — 30 (15 user + 15 trade) across pending/dismissed/actioned')
        self._seed_reports(collectors, completed_trades, admin, rng)

        self._announce('TradeWhatsAppOptIn — opt-ins on 25 of the completed trades (15 both, 10 one-side)')
        self._seed_whatsapp_optins(completed_trades, rng)

        self._announce('Sponsor — 1 active (Coca-Cola) + 2 historical')
        self._seed_sponsors()

        self._announce('Ad campaigns — 10 (mixed status) + 20 creatives')
        creatives = self._seed_ad_campaigns(admin, rng)

        if options['skip_impressions']:
            self.stdout.write(self.style.WARNING('  · skipping ad impressions (--skip-impressions)'))
        else:
            self._announce(f"Ad impressions — {options['ad_impressions']} + 5% clicks")
            self._seed_ad_impressions(creatives, collectors, options['ad_impressions'], rng)

        self._announce('Push subscriptions — 1-2 per collector (non-routable endpoints)')
        self._seed_push_subscriptions(collectors, rng)

        self._announce('Notifications — review_received + review_reply (match_mutual auto-created by signal)')
        self._seed_notifications(collectors, rng)

        self._announce('Presence — distributed across now / 5min / 30min / 2h / 1d ago')
        self._seed_presence(collectors, rng)

        self.stdout.write(self.style.SUCCESS('\n==== Heavy seed complete ===='))
        self._print_summary()

    # ------------------------------------------------------------------
    # Reset
    # ------------------------------------------------------------------
    def _reset(self):
        self.stdout.write(self.style.WARNING('--- RESET (deleting seed data) ---'))
        AdClick.objects.all().delete()
        AdImpression.objects.all().delete()
        AdCreative.objects.all().delete()
        AdCampaign.objects.all().delete()
        Sponsor.objects.all().delete()
        Notification.objects.all().delete()
        ReviewReport.objects.all().delete()
        Review.objects.all().delete()
        Report.objects.all().delete()
        TradeWhatsAppOptIn.objects.all().delete()
        Trade.objects.all().delete()
        Like.objects.all().delete()
        Match.objects.all().delete()
        UserSticker.objects.all().delete()
        Sticker.objects.all().delete()
        Album.objects.all().delete()
        PushSubscription.objects.all().delete()
        MerchantSubscriptionPayment.objects.all().delete()
        # Keep User rows so signals don't churn (canonical accounts re-used).
        # Profiles stay (1:1 with User).

    # ------------------------------------------------------------------
    # Catalogue
    # ------------------------------------------------------------------
    def _load_catalogue(self) -> dict:
        path = Path(__file__).resolve().parents[2] / 'fixtures' / 'mundial26_catalogue.json'
        with path.open(encoding='utf-8') as f:
            return json.load(f)

    def _seed_album(self, catalogue: dict) -> Album:
        meta = catalogue['album']
        album, _ = Album.objects.update_or_create(
            slug=meta['slug'],
            defaults={
                'name': meta['name'],
                'edition_year': meta['edition_year'],
                'total_stickers': meta['total_stickers'],
                'is_active': True,
                'launch_date': date.fromisoformat(meta['launch_date']),
                'cover_image_url': '',
            },
        )
        return album

    def _seed_stickers(self, album: Album, catalogue: dict) -> list[Sticker]:
        existing = {s.number: s for s in Sticker.objects.filter(album=album)}
        to_create: list[Sticker] = []
        all_stickers: list[Sticker] = []

        # Regular stickers: 32 teams × 20 = 640. Numbering 001..640 sequentially.
        seq = 1
        for team in catalogue['teams']:
            entries = self._team_sticker_entries(team)
            for entry in entries:
                number = f'{seq:03d}'
                seq += 1
                if number in existing:
                    all_stickers.append(existing[number])
                    continue
                to_create.append(Sticker(
                    album=album,
                    number=number,
                    name=entry['name'],
                    team=team['name'],
                    image_url='',
                    is_special_edition=False,
                    special_tier='',
                    market_value_estimate=Decimal('500'),
                ))

        # Special editions: numbered S01..S30.
        for special in catalogue['specials']:
            number = special['slug_suffix']
            if number in existing:
                all_stickers.append(existing[number])
                continue
            to_create.append(Sticker(
                album=album,
                number=number,
                name=special['name'],
                team=special.get('team', ''),
                image_url='',
                is_special_edition=True,
                special_tier=special['tier'],
                market_value_estimate=Decimal(special['value_cop']),
            ))

        if to_create:
            Sticker.objects.bulk_create(to_create, batch_size=200, ignore_conflicts=True)
        # Re-fetch in stable order so callers can index.
        all_stickers = list(Sticker.objects.filter(album=album).order_by('number'))
        return all_stickers

    @staticmethod
    def _team_sticker_entries(team: dict) -> list[dict]:
        """One escudo + one estadio + one técnico + 17 jugadores per team."""
        out: list[dict] = []
        out.append({'name': f'Escudo · {team["name"]}'})
        out.append({'name': f'Estadio · {team["stadium"]}'})
        out.append({'name': f'DT · {team["coach"]}'})
        # 5 nominal stars + 12 fillers numbered J06..J17.
        for star in team['stars'][:5]:
            out.append({'name': star})
        for i in range(6, 18):
            out.append({'name': f'{team["name"]} · Jugador #{i}'})
        return out

    # ------------------------------------------------------------------
    # Users + profiles
    # ------------------------------------------------------------------
    def _seed_users(self, n_collectors: int, n_merchants: int, rng: random.Random, fake: Faker):
        collectors: list[User] = []
        merchants: list[User] = []

        # Canonical collectors (10 known emails) + Faker for the rest.
        canonical = [
            ('user@example.com', 'Lucía', 'Rojas'),
            ('user2@example.com', 'Camilo', 'Pérez'),
            ('user3@example.com', 'Andrés', 'Gómez'),
            ('user4@example.com', 'Valeria', 'Castro'),
            ('user5@example.com', 'Mateo', 'López'),
            ('user6@example.com', 'Daniela', 'Ruiz'),
            ('user7@example.com', 'Sebastián', 'Torres'),
            ('user8@example.com', 'Camila', 'Vargas'),
            ('user9@example.com', 'Nicolás', 'Mejía'),
            ('user10@example.com', 'Sofía', 'Ramírez'),
        ]
        for email, first, last in canonical[:n_collectors]:
            u = self._upsert_user(email, first, last, User.Role.COLLECTOR, is_staff=False)
            collectors.append(u)

        # Faker collectors for the remainder.
        used_emails = {u.email for u in collectors}
        i = 1
        while len(collectors) < n_collectors:
            email = f'collector{i}@example.com'
            i += 1
            if email in used_emails:
                continue
            u = self._upsert_user(email, fake.first_name(), fake.last_name(), User.Role.COLLECTOR, is_staff=False)
            collectors.append(u)

        # Merchants — one per city.
        merchant_emails = ['merchant@example.com'] + [f'merchant{i}@example.com' for i in range(2, n_merchants + 1)]
        for email in merchant_emails[:n_merchants]:
            u = self._upsert_user(email, 'Comerciante', email.split('@')[0].title(), User.Role.MERCHANT, is_staff=False)
            merchants.append(u)

        admin = self._upsert_user('admin@example.com', 'Albun', 'Admin', User.Role.ADMIN, is_staff=True)

        return collectors, merchants, admin

    @staticmethod
    def _upsert_user(email: str, first: str, last: str, role, is_staff: bool) -> User:
        user, created = User.objects.update_or_create(
            email=email,
            defaults={
                'first_name': first,
                'last_name': last,
                'role': role,
                'is_staff': is_staff,
                'is_active': True,
            },
        )
        if created or not user.has_usable_password():
            user.set_password('password')
            user.save()
        user.assign_role(role)
        return user

    def _seed_profiles(self, collectors: list[User], merchants: list[User], album: Album, rng: random.Random, fake: Faker):
        for user in collectors:
            city = rng.choice(CITIES)
            jitter_lat = rng.uniform(-0.04, 0.04)
            jitter_lng = rng.uniform(-0.04, 0.04)
            profile = user.profile
            profile.active_album_id = album.id
            profile.city = city['name']
            # 2-decimal rounding (≈1.1 km privacy radius).
            profile.lat_approx = Decimal(str(round(city['lat'] + jitter_lat, 2)))
            profile.lng_approx = Decimal(str(round(city['lng'] + jitter_lng, 2)))
            profile.browser_geo_optin = True
            # ~40% opt in to WhatsApp with a CO-style number.
            if rng.random() < 0.4 and not profile.whatsapp_e164:
                profile.whatsapp_e164 = f'+5730{rng.randint(10, 99)}{rng.randint(1000000, 9999999)}'
                profile.whatsapp_optin = True
            profile.save()
        # Merchants get geo at the city center.
        for merchant, city in zip(merchants, CITIES):
            profile = merchant.profile
            profile.city = city['name']
            profile.lat_approx = Decimal(str(round(city['lat'], 2)))
            profile.lng_approx = Decimal(str(round(city['lng'], 2)))
            profile.save()

    def _seed_merchant_profiles_and_payments(self, merchants: list[User], admin: User, rng: random.Random):
        for user, city in zip(merchants, CITIES):
            mp, _ = MerchantProfile.objects.update_or_create(
                user=user,
                defaults={
                    'business_name': f'Papelería {city["name"]}',
                    'business_type': rng.choice(['papeleria', 'kiosco', 'distribuidor']),
                    'address': f'Cra {rng.randint(1, 80)} # {rng.randint(10, 90)}-{rng.randint(1, 99)}, {city["name"]}',
                    'lat': Decimal(str(round(city['lat'], 6))),
                    'lng': Decimal(str(round(city['lng'], 6))),
                    'opening_hours': {
                        'mon': '08:00-18:00', 'tue': '08:00-18:00', 'wed': '08:00-18:00',
                        'thu': '08:00-18:00', 'fri': '08:00-18:00', 'sat': '09:00-14:00',
                    },
                    'declared_stock': 'Sobres Mundial 26 disponibles. Llegada semanal.',
                    'subscription_status': 'active',
                    'subscription_expires_at': timezone.now() + timedelta(days=30),
                },
            )
            # 4 monthly payments — one per month for the last 4 months.
            MerchantSubscriptionPayment.objects.filter(merchant=mp).delete()
            now = timezone.now()
            for months_ago in range(3, -1, -1):
                year, month = now.year, now.month - months_ago
                while month < 1:
                    month += 12
                    year -= 1
                paid_at = datetime(year, month, 1, 12, 0, tzinfo=dt_timezone.utc)
                MerchantSubscriptionPayment.objects.create(
                    merchant=mp, paid_at=paid_at, registered_by=admin,
                    amount_cop=Decimal('200000'), period_months=1, method='nequi',
                    reference=f'NQ-{paid_at.strftime("%Y%m")}-{user.id:04d}',
                )

    # ------------------------------------------------------------------
    # Inventories
    # ------------------------------------------------------------------
    def _seed_inventories(self, collectors: list[User], stickers: list[Sticker], rng: random.Random):
        # Wipe first so re-runs don't compound counts.
        UserSticker.objects.filter(user__in=collectors).delete()
        rows: list[UserSticker] = []
        for user in collectors:
            # Each collector touches 30-70% of the catalogue (random-rounded).
            coverage = rng.uniform(0.3, 0.7)
            sample = rng.sample(stickers, k=int(len(stickers) * coverage))
            for s in sample:
                roll = rng.random()
                if roll < 0.60:
                    count = 1                       # pasted
                elif roll < 0.85:
                    count = rng.randint(2, 4)       # repeated
                else:
                    count = 0                       # explicitly missing entry
                rows.append(UserSticker(user=user, sticker=s, count=count))
        UserSticker.objects.bulk_create(rows, batch_size=1000, ignore_conflicts=True)

    # ------------------------------------------------------------------
    # Matches + Likes
    # ------------------------------------------------------------------
    def _seed_matches(self, collectors: list[User], stickers: list[Sticker], n_mutual: int, rng: random.Random):
        Match.objects.all().delete()
        Like.objects.all().delete()
        mutual: list[Match] = []
        open_matches: list[Match] = []

        # Pre-shuffle pairs to avoid same-collector bias.
        ids = [u.id for u in collectors]
        seen_pairs: set[tuple[int, int]] = set()

        def _next_pair():
            for _ in range(2000):  # bounded retries
                a, b = rng.sample(ids, 2)
                lo, hi = (a, b) if a < b else (b, a)
                if (lo, hi) not in seen_pairs:
                    seen_pairs.add((lo, hi))
                    return lo, hi
            return None

        # 50 mutual matches
        for i in range(n_mutual):
            pair = _next_pair()
            if not pair:
                break
            lo, hi = pair
            channel = Match.Channel.SWIPE if i % 4 != 0 else Match.Channel.QR_PRESENCIAL
            m = Match.objects.create(
                user_a_id=lo, user_b_id=hi, channel=channel, status=Match.Status.MUTUAL,
            )
            mutual.append(m)
            # 2 mirror Likes.
            give = rng.choice(stickers)
            take = rng.choice(stickers)
            user_lo = next(u for u in collectors if u.id == lo)
            user_hi = next(u for u in collectors if u.id == hi)
            Like.objects.create(from_user=user_lo, to_user=user_hi, sticker_offered=give, sticker_wanted=take)
            Like.objects.create(from_user=user_hi, to_user=user_lo, sticker_offered=take, sticker_wanted=give)

        # 30 open matches (one-way interest, no mirror Like)
        for i in range(30):
            pair = _next_pair()
            if not pair:
                break
            lo, hi = pair
            m = Match.objects.create(
                user_a_id=lo, user_b_id=hi, channel=Match.Channel.SWIPE, status=Match.Status.CONFIRMED,
            )
            open_matches.append(m)
            user_lo = next(u for u in collectors if u.id == lo)
            user_hi = next(u for u in collectors if u.id == hi)
            Like.objects.create(
                from_user=user_lo, to_user=user_hi,
                sticker_offered=rng.choice(stickers), sticker_wanted=rng.choice(stickers),
            )

        return mutual, open_matches

    # ------------------------------------------------------------------
    # Trades
    # ------------------------------------------------------------------
    def _seed_trades(self, matches_mutual: list[Match], n_completed: int, n_open: int, n_cancelled: int, rng: random.Random):
        # Trade is OneToOneField on Match; each Trade picks a unique Match.
        # Delete trade-targeted Reports first — they have on_delete=SET_NULL
        # which would violate the report_target_matches_kind CheckConstraint.
        Report.objects.filter(target_kind=Report.TargetKind.TRADE).delete()
        Trade.objects.all().delete()
        avail = list(matches_mutual)
        rng.shuffle(avail)
        completed: list[Trade] = []

        def _items(match: Match) -> list[dict]:
            # Snapshot of the 2 mirror Likes' stickers (use the first 2 we find).
            likes = list(Like.objects.filter(
                from_user_id__in=[match.user_a_id, match.user_b_id],
                to_user_id__in=[match.user_a_id, match.user_b_id],
            )[:2])
            return [
                {'from_user': lk.from_user_id, 'to_user': lk.to_user_id, 'sticker_id': lk.sticker_offered_id}
                for lk in likes
            ]

        for status, count, bucket in (
            (Trade.Status.COMPLETED, n_completed, completed),
            (Trade.Status.OPEN, n_open, []),
            (Trade.Status.CANCELLED, n_cancelled, []),
        ):
            for _ in range(count):
                if not avail:
                    break
                match = avail.pop()
                t = Trade.objects.create(match=match, items=_items(match), status=status)
                if bucket is completed:
                    bucket.append(t)
        return completed

    # ------------------------------------------------------------------
    # Reviews + ReviewReports
    # ------------------------------------------------------------------
    def _seed_reviews(self, completed_trades: list[Trade], rng: random.Random) -> list[Review]:
        Review.objects.all().delete()
        # Bell-curve star distribution.
        star_population = [5] * 60 + [4] * 20 + [3] * 10 + [2] * 5 + [1] * 5
        low_stars: list[Review] = []
        positive_pool = REVIEW_TAGS_POSITIVE
        negative_pool = REVIEW_TAGS_NEGATIVE
        for trade in completed_trades:
            match = trade.match
            participants = [match.user_a, match.user_b]
            # 70% chance both review, 30% only one.
            if rng.random() < 0.7:
                reviewers = participants
            else:
                reviewers = [rng.choice(participants)]
            for reviewer in reviewers:
                reviewee = match.user_b if reviewer == match.user_a else match.user_a
                stars = rng.choice(star_population)
                tags = rng.sample(positive_pool, k=2) if stars >= 4 else rng.sample(negative_pool, k=2)
                comment = (
                    'Excelente intercambio, todo perfecto.' if stars == 5 else
                    'Buen intercambio, recomendado.' if stars == 4 else
                    'Cumplió, sin más.' if stars == 3 else
                    'Llegó tarde y los cromos estaban un poco doblados.' if stars == 2 else
                    'No se presentó al punto acordado. No recomiendo.'
                )
                r, _ = Review.objects.update_or_create(
                    trade=trade, reviewer=reviewer,
                    defaults={
                        'reviewee': reviewee, 'stars': stars, 'comment': comment, 'tags': tags,
                    },
                )
                if stars <= 2:
                    low_stars.append(r)
                # 20% of high-star reviews get a public reply.
                if stars >= 4 and rng.random() < 0.2:
                    r.reply = '¡Gracias por la reseña! Un placer intercambiar contigo.'
                    r.replied_at = timezone.now()
                    r.save(update_fields=['reply', 'replied_at', 'updated_at'])
        return low_stars

    def _seed_review_reports(self, low_star_reviews: list[Review], collectors: list[User], admin: User, rng: random.Random):
        ReviewReport.objects.all().delete()
        if not low_star_reviews:
            return
        sample = rng.sample(low_star_reviews, k=min(8, len(low_star_reviews)))
        statuses = (
            [ReviewReport.Status.PENDING] * 5 +
            [ReviewReport.Status.DISMISSED] * 2 +
            [ReviewReport.Status.ACTIONED] * 1
        )
        for review, status in zip(sample, statuses):
            # Reporter must NOT be the reviewer (else the constraint trips).
            reporter = next(
                (u for u in collectors if u.id not in {review.reviewer_id, review.reviewee_id}),
                None,
            )
            if reporter is None:
                continue
            ReviewReport.objects.create(
                review=review,
                reporter=reporter,
                reason='Reseña parece injusta o spam.',
                status=status,
                resolved_by=admin if status != ReviewReport.Status.PENDING else None,
                resolved_at=timezone.now() if status != ReviewReport.Status.PENDING else None,
            )

    # ------------------------------------------------------------------
    # Reports (general moderation)
    # ------------------------------------------------------------------
    def _seed_reports(self, collectors: list[User], completed_trades: list[Trade], admin: User, rng: random.Random):
        Report.objects.all().delete()
        statuses = [Report.Status.PENDING] * 18 + [Report.Status.DISMISSED] * 8 + [Report.Status.ACTIONED] * 4
        reasons = [Report.Reason.NO_SHOW, Report.Reason.HARASSMENT, Report.Reason.FAKE_PROFILE, Report.Reason.OTHER]
        # 15 user-targeted + 15 trade-targeted.
        for i in range(15):
            reporter, target = rng.sample(collectors, 2)
            status = statuses[i]
            Report.objects.create(
                reporter=reporter,
                target_kind=Report.TargetKind.USER,
                target_user=target,
                reason=rng.choice(reasons),
                detail='Reporte automático de seed Heavy.',
                status=status,
                resolved_by=admin if status != Report.Status.PENDING else None,
                resolved_at=timezone.now() if status != Report.Status.PENDING else None,
            )
        for i in range(15):
            if not completed_trades:
                break
            trade = rng.choice(completed_trades)
            reporter = rng.choice(collectors)
            status = statuses[15 + i]
            Report.objects.create(
                reporter=reporter,
                target_kind=Report.TargetKind.TRADE,
                target_trade=trade,
                reason=Report.Reason.NO_SHOW,
                detail='No apareció en el punto acordado.',
                status=status,
                resolved_by=admin if status != Report.Status.PENDING else None,
                resolved_at=timezone.now() if status != Report.Status.PENDING else None,
            )

    # ------------------------------------------------------------------
    # WhatsApp opt-ins
    # ------------------------------------------------------------------
    def _seed_whatsapp_optins(self, completed_trades: list[Trade], rng: random.Random):
        TradeWhatsAppOptIn.objects.all().delete()
        # 15 trades: both opt-in. 10 trades: only one side.
        sample = rng.sample(completed_trades, k=min(25, len(completed_trades)))
        for trade in sample[:15]:
            for u in (trade.match.user_a, trade.match.user_b):
                TradeWhatsAppOptIn.objects.create(trade=trade, user=u, opted_in=True)
        for trade in sample[15:25]:
            u = rng.choice([trade.match.user_a, trade.match.user_b])
            TradeWhatsAppOptIn.objects.create(trade=trade, user=u, opted_in=True)

    # ------------------------------------------------------------------
    # Sponsors + ads
    # ------------------------------------------------------------------
    def _seed_sponsors(self):
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
        for brand, days_ago_end in (('Bavaria', 30), ('Bancolombia', 90)):
            Sponsor.objects.update_or_create(
                brand_name=brand,
                defaults={
                    'logo_url': f'https://placehold.co/240x80/0a0a0a/fff?text={brand}',
                    'primary_color': '#101010',
                    'secondary_color': '#FFFFFF',
                    'message_text': f'{brand} acompañó la fase previa.',
                    'active_from': timezone.now() - timedelta(days=days_ago_end + 60),
                    'active_until': timezone.now() - timedelta(days=days_ago_end),
                    'contract_amount': Decimal('100000000'),
                },
            )

    def _seed_ad_campaigns(self, admin: User, rng: random.Random) -> list[AdCreative]:
        AdImpression.objects.all().delete()
        AdCreative.objects.all().delete()
        AdCampaign.objects.all().delete()
        statuses = (
            [AdCampaign.Status.ACTIVE] * 6 +
            [AdCampaign.Status.PAUSED] * 2 +
            [AdCampaign.Status.ENDED] * 1 +
            [AdCampaign.Status.DRAFT] * 1
        )
        creatives: list[AdCreative] = []
        today = date.today()
        for advertiser, status in zip(ADVERTISERS, statuses):
            campaign = AdCampaign.objects.create(
                advertiser_name=advertiser,
                impressions_purchased=rng.choice([50000, 100000, 250000]),
                cpm_rate_cop=Decimal(str(rng.choice([12000, 15000, 20000]))),
                geo_targeting_cities='' if rng.random() < 0.5 else rng.choice([c['name'] for c in CITIES]),
                weight=rng.randint(1, 5),
                start_date=today - timedelta(days=rng.randint(7, 30)),
                end_date=today + timedelta(days=rng.randint(30, 120)),
                status=status,
                created_by=admin,
            )
            n_creatives = rng.randint(1, 3)
            for k in range(n_creatives):
                cr = AdCreative.objects.create(
                    campaign=campaign,
                    image_url=f'https://placehold.co/1200x300/0a0a0a/fff?text={advertiser}+{k+1}',
                    click_url=f'https://example.com/{advertiser.lower()}',
                    headline=f'{advertiser} · Mundial 26',
                    body=f'Vive la pasión con {advertiser}.',
                    weight=rng.randint(1, 5),
                    is_active=(status == AdCampaign.Status.ACTIVE),
                )
                if cr.is_active:
                    creatives.append(cr)
        return creatives

    def _seed_ad_impressions(self, creatives: list[AdCreative], collectors: list[User], total: int, rng: random.Random):
        if not creatives:
            return
        slots = [AdImpression.Slot.HOME, AdImpression.Slot.FEED]
        cities = [c['name'] for c in CITIES]
        rows: list[AdImpression] = []
        for _ in range(total):
            rows.append(AdImpression(
                creative=rng.choice(creatives),
                user=rng.choice(collectors) if rng.random() < 0.05 else None,
                slot=rng.choice(slots),
                city=rng.choice(cities),
            ))
        AdImpression.objects.bulk_create(rows, batch_size=500)
        served = list(AdImpression.objects.all())
        # 5% click-through.
        for imp in rng.sample(served, k=min(int(total * 0.05), len(served))):
            AdClick.objects.create(impression=imp)

    # ------------------------------------------------------------------
    # Push subscriptions
    # ------------------------------------------------------------------
    def _seed_push_subscriptions(self, collectors: list[User], rng: random.Random):
        PushSubscription.objects.filter(user__in=collectors).delete()
        rows: list[PushSubscription] = []
        for u in collectors:
            n = rng.choice([1, 1, 2])  # weighted: most have 1, some have 2
            for k in range(n):
                rows.append(PushSubscription(
                    user=u,
                    endpoint=f'https://push.example.invalid/seed-{u.id}-{k}',
                    p256dh='seed-p256dh-key',
                    auth='seed-auth-secret',
                    user_agent='Mozilla/5.0 (seed)',
                ))
        PushSubscription.objects.bulk_create(rows, batch_size=500, ignore_conflicts=True)

    # ------------------------------------------------------------------
    # Notifications (signal already creates match_mutual ones)
    # ------------------------------------------------------------------
    def _seed_notifications(self, collectors: list[User], rng: random.Random):
        # match_mutual notifications were created by the post_save signal
        # when we bulk-inserted Match rows above. We add review_received +
        # review_reply ones for visual richness.
        for review in Review.objects.all().select_related('reviewer', 'reviewee')[:80]:
            Notification.objects.get_or_create(
                user=review.reviewee, kind=Notification.Kind.REVIEW_RECEIVED, review=review,
                defaults={
                    'title': 'Recibiste una reseña',
                    'body': f'{review.reviewer.email} te calificó con {review.stars}★.',
                    'url': '/profile/me',
                    'actor': review.reviewer,
                    'read_at': timezone.now() - timedelta(days=1) if rng.random() < 0.3 else None,
                },
            )
            if review.reply:
                Notification.objects.get_or_create(
                    user=review.reviewer, kind=Notification.Kind.REVIEW_REPLY, review=review,
                    defaults={
                        'title': 'Respondieron tu reseña',
                        'body': f'{review.reviewee.email} respondió tu reseña.',
                        'url': '/profile/me',
                        'actor': review.reviewee,
                    },
                )

    # ------------------------------------------------------------------
    # Presence (Live Badge)
    # ------------------------------------------------------------------
    def _seed_presence(self, collectors: list[User], rng: random.Random):
        now = timezone.now()
        buckets = (
            (0.30, timedelta(seconds=0)),
            (0.25, timedelta(minutes=5)),
            (0.20, timedelta(minutes=30)),
            (0.15, timedelta(hours=2)),
            (0.10, timedelta(days=1)),
        )
        for u in collectors:
            roll = rng.random()
            cum = 0.0
            chosen = buckets[-1][1]
            for prob, delta in buckets:
                cum += prob
                if roll <= cum:
                    chosen = delta
                    break
            Profile.objects.filter(user=u).update(last_seen=now - chosen)

    # ------------------------------------------------------------------
    # Output
    # ------------------------------------------------------------------
    def _announce(self, msg: str):
        self.stdout.write(self.style.SUCCESS(f'\n--- {msg} ---'))

    def _print_summary(self):
        self.stdout.write('')
        for label, qs in (
            ('Users',           User.objects.all()),
            ('  collectors',    User.objects.filter(role=User.Role.COLLECTOR)),
            ('  merchants',     User.objects.filter(role=User.Role.MERCHANT)),
            ('  admins',        User.objects.filter(role=User.Role.ADMIN)),
            ('Albums',          Album.objects.all()),
            ('Stickers',        Sticker.objects.all()),
            ('UserStickers',    UserSticker.objects.all()),
            ('Matches',         Match.objects.all()),
            ('  mutual',        Match.objects.filter(status=Match.Status.MUTUAL)),
            ('Likes',           Like.objects.all()),
            ('Trades',          Trade.objects.all()),
            ('  completed',     Trade.objects.filter(status=Trade.Status.COMPLETED)),
            ('Reviews',         Review.objects.all()),
            ('ReviewReports',   ReviewReport.objects.all()),
            ('Reports',         Report.objects.all()),
            ('TradeWhatsAppOptIn', TradeWhatsAppOptIn.objects.all()),
            ('MerchantProfiles', MerchantProfile.objects.all()),
            ('MerchantSubscriptionPayments', MerchantSubscriptionPayment.objects.all()),
            ('Sponsors',        Sponsor.objects.all()),
            ('AdCampaigns',     AdCampaign.objects.all()),
            ('AdCreatives',     AdCreative.objects.all()),
            ('AdImpressions',   AdImpression.objects.all()),
            ('AdClicks',        AdClick.objects.all()),
            ('PushSubscriptions', PushSubscription.objects.all()),
            ('Notifications',   Notification.objects.all()),
        ):
            self.stdout.write(f'  {label:35s} {qs.count():>7d}')
