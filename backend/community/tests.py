from datetime import datetime, timedelta
from unittest.mock import patch
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Car, Location
from community.models import Alert, Rating
from rides.models import Booking, Ride


User = get_user_model()
RIDE_TIMEZONE = ZoneInfo("Europe/Warsaw")


class CommunitySmokeTests(TestCase):
    def test_placeholder(self):
        self.assertTrue(True)


class CreateRatingViewTests(APITestCase):
    def setUp(self):
        self.driver = User.objects.create_user(
            email="driver@example.com",
            password="secret123",
            first_name="Jan",
            last_name="Kierowca",
        )
        self.passenger = User.objects.create_user(
            email="passenger@example.com",
            password="secret123",
            first_name="Anna",
            last_name="Pasazer",
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="secret123",
        )

        self.car = Car.objects.create(
            owner=self.driver,
            brand="Toyota",
            model="Yaris",
            license_plate="BI55555",
            seats=4,
        )
        self.start_location = Location.objects.create(
            user=self.driver,
            name="Start",
            city="Białystok",
            postal_code="15-001",
            street="Lipowa",
            st_number="12",
            latitude="53.132500",
            longitude="23.168800",
        )
        self.end_location = Location.objects.create(
            user=self.driver,
            name="Meta",
            city="Choroszcz",
            postal_code="16-070",
            street="Sienkiewicza",
            st_number="8",
            latitude="53.143200",
            longitude="22.988700",
        )

        response = self.client.post(
            reverse("token_obtain_pair"),
            {"email": "passenger@example.com", "password": "secret123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def create_ride(self, departure_date):
        return Ride.objects.create(
            driver=self.driver,
            car=self.car,
            start_location=self.start_location,
            end_location=self.end_location,
            departure_date=departure_date,
            departure_time="08:00:00",
            cost_per_passenger="20.00",
            available_seats=3,
            status="active",
        )

    def create_ride_with_time(self, departure_date, departure_time):
        return Ride.objects.create(
            driver=self.driver,
            car=self.car,
            start_location=self.start_location,
            end_location=self.end_location,
            departure_date=departure_date,
            departure_time=departure_time,
            cost_per_passenger="20.00",
            available_seats=3,
            status="active",
        )

    def test_passenger_can_rate_completed_ride_once(self):
        ride = self.create_ride(timezone.localdate() - timedelta(days=1))
        Booking.objects.create(ride=ride, passenger=self.passenger, seat_count=1, status="active")

        response = self.client.post(
            reverse("create-rating", kwargs={"ride_id": ride.id}),
            {"score": 5, "comment": "Bardzo dobry kierowca."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Rating.objects.count(), 1)
        self.assertEqual(Rating.objects.get().rated_user, self.driver)
        self.assertEqual(Alert.objects.count(), 1)

    def test_cannot_rate_ride_before_it_finishes(self):
        test_date = timezone.localdate()
        ride = self.create_ride_with_time(test_date, "23:59:00")
        Booking.objects.create(ride=ride, passenger=self.passenger, seat_count=1, status="active")

        with patch(
            "community.views.timezone.now",
            return_value=timezone.make_aware(
                datetime.combine(test_date, datetime.strptime("18:00:00", "%H:%M:%S").time()),
                RIDE_TIMEZONE,
            ),
        ):
            response = self.client.post(
                reverse("create-rating", kwargs={"ride_id": ride.id}),
                {"score": 4, "comment": "Za wcześnie."},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ride", response.data)

    def test_can_rate_ride_later_the_same_day_after_departure_time(self):
        test_date = timezone.localdate()
        ride = self.create_ride_with_time(test_date, "08:00:00")
        Booking.objects.create(ride=ride, passenger=self.passenger, seat_count=1, status="active")

        with patch(
            "community.views.timezone.now",
            return_value=timezone.make_aware(
                datetime.combine(test_date, datetime.strptime("18:00:00", "%H:%M:%S").time()),
                RIDE_TIMEZONE,
            ),
        ):
            response = self.client.post(
                reverse("create-rating", kwargs={"ride_id": ride.id}),
                {"score": 5, "comment": "Po czasie odjazdu."},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_only_booked_passenger_can_rate_ride(self):
        ride = self.create_ride(timezone.localdate() - timedelta(days=1))

        response = self.client.post(
            reverse("create-rating", kwargs={"ride_id": ride.id}),
            {"score": 4, "comment": "Nie jechałem."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ride", response.data)

    def test_passenger_cannot_rate_same_ride_twice(self):
        ride = self.create_ride(timezone.localdate() - timedelta(days=1))
        Booking.objects.create(ride=ride, passenger=self.passenger, seat_count=1, status="active")
        Rating.objects.create(
            ride=ride,
            rater=self.passenger,
            rated_user=self.driver,
            score=5,
            comment="Pierwsza ocena",
        )

        response = self.client.post(
            reverse("create-rating", kwargs={"ride_id": ride.id}),
            {"score": 3, "comment": "Druga ocena"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ride", response.data)

    def test_my_rides_marks_completed_unrated_passenger_ride_as_not_rated(self):
        ride = self.create_ride(timezone.localdate() - timedelta(days=1))
        Booking.objects.create(
            ride=ride,
            passenger=self.passenger,
            seat_count=1,
            status="active",
        )

        response = self.client.get(reverse("my_rides"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["as_passenger"]), 1)
        self.assertFalse(response.data["as_passenger"][0]["current_user_has_rated"])
