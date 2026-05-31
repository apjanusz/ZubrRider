from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Car, Location
from community.models import Rating
from rides.models import Booking, Ride


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
        self.other_user = User.objects.create_user(email="other@example.com", password="secret123")
        self.other_car = Car.objects.create(
            owner=self.other_user,
            brand="Toyota",
            model="Yaris",
            license_plate="BI54321",
            seats=5,
        )
        response = self.client.post(
            reverse("token_obtain_pair"),
            {"email": "driver@example.com", "password": "secret123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def _create_location(self, name, city, street, st_number):
        return Location.objects.create(
            user=self.user,
            name=name,
            city=city,
            postal_code="15-001",
            street=street,
            st_number=st_number,
            latitude="53.132500",
            longitude="23.168800",
        )

    @patch("rides.serializers.OpenRouteServiceClient")
    def test_create_ride_geocodes_locations_when_coordinates_are_missing(self, client_cls):
        client_cls.return_value.geocode.side_effect = [
            [{"latitude": 53.1325, "longitude": 23.1688, "postal_code": "15-001"}],
            [{"latitude": 53.0167, "longitude": 22.9500, "postal_code": "18-100"}],
        ]

        response = self.client.post(
            reverse("ride_create"),
            {
                "car_id": self.car.id,
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
                "car_id": self.car.id,
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
        self.assertEqual(ride.car_id, self.car.id)
        self.assertEqual(float(ride.start_location.latitude), 53.1325)
        self.assertEqual(float(ride.end_location.longitude), 22.95)

    def test_create_ride_rejects_car_belonging_to_another_user(self):
        response = self.client.post(
            reverse("ride_create"),
            {
                "car_id": self.other_car.id,
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

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["car_id"][0], "Wybrany pojazd nie należy do użytkownika")

    def test_created_ride_is_visible_in_my_rides_with_selected_car(self):
        create_response = self.client.post(
            reverse("ride_create"),
            {
                "car_id": self.car.id,
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

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        my_rides_response = self.client.get(reverse("my_rides"))

        self.assertEqual(my_rides_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(my_rides_response.data["as_driver"]), 1)
        self.assertEqual(
            my_rides_response.data["as_driver"][0]["car"]["license_plate"],
            "BI12345",
        )

    def test_my_rides_includes_rating_flag_for_authenticated_user(self):
        ride = Ride.objects.create(
            driver=self.other_user,
            car=self.other_car,
            start_location=self._create_location("Start", "Bialystok", "Koncowa", "50"),
            end_location=self._create_location("Koniec", "Lapy", "Dluga", "39"),
            departure_date="2026-04-21",
            departure_time="06:00:00",
            cost_per_passenger="20.00",
            available_seats=2,
            status="active",
        )
        Booking.objects.create(ride=ride, passenger=self.user, seat_count=1, status="active")
        Rating.objects.create(
            ride=ride,
            rater=self.user,
            rated_user=self.other_user,
            score=5,
            comment="Test",
        )

        response = self.client.get(reverse("my_rides"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["as_passenger"][0]["current_user_has_rated"])
