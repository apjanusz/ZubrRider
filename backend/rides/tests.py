from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Car
from rides.models import Ride


User = get_user_model()


class RideCreateSerializerTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="driver@example.com", password="secret123")
        self.car = Car.objects.create(
            owner=self.user,
            brand="Renault",
            model="Clio",
            license_plate="BI12345",
            seats=4,
        )
        response = self.client.post(
            reverse("token_obtain_pair"),
            {"email": "driver@example.com", "password": "secret123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    @patch("rides.serializers.OpenRouteServiceClient")
    def test_create_ride_geocodes_locations_when_coordinates_are_missing(self, client_cls):
        client_cls.return_value.geocode.side_effect = [
            [{"latitude": 53.1325, "longitude": 23.1688, "postal_code": "15-001"}],
            [{"latitude": 53.0167, "longitude": 22.9500, "postal_code": "18-100"}],
        ]

        response = self.client.post(
            reverse("ride_create"),
            {
                "start_location": {
                    "name": "Start",
                    "city": "Bialystok",
                    "street": "Koncowa",
                    "st_number": "50",
                },
                "end_location": {
                    "name": "Koniec",
                    "city": "Lapy",
                    "street": "Dluga",
                    "st_number": "39",
                },
                "departure_date": "2026-04-21",
                "departure_time": "06:00:00",
                "cost_per_passenger": "20.00",
                "available_seats": 2,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Ride.objects.count(), 1)
        self.assertEqual(float(response.data["start_location"]["latitude"]), 53.1325)
        self.assertEqual(float(response.data["end_location"]["longitude"]), 22.95)

    def test_create_ride_uses_coordinates_from_payload(self):
        response = self.client.post(
            reverse("ride_create"),
            {
                "start_location": {
                    "name": "Start",
                    "city": "Bialystok",
                    "street": "Koncowa",
                    "st_number": "50",
                    "postal_code": "15-001",
                    "latitude": 53.1325,
                    "longitude": 23.1688,
                },
                "end_location": {
                    "name": "Koniec",
                    "city": "Lapy",
                    "street": "Dluga",
                    "st_number": "39",
                    "postal_code": "18-100",
                    "latitude": 53.0167,
                    "longitude": 22.95,
                },
                "departure_date": "2026-04-21",
                "departure_time": "06:00:00",
                "cost_per_passenger": "20.00",
                "available_seats": 2,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Ride.objects.count(), 1)
        ride = Ride.objects.select_related("start_location", "end_location").get()
        self.assertEqual(float(ride.start_location.latitude), 53.1325)
        self.assertEqual(float(ride.end_location.longitude), 22.95)
