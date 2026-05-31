from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Car, Location
from rides.models import Booking, Ride


User = get_user_model()


class MyCarsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="driver@example.com",
            password="secret123",
            first_name="Jan",
            last_name="Kierowca",
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="secret123",
        )
        self.other_car = Car.objects.create(
            owner=self.other_user,
            brand="Opel",
            model="Astra",
            license_plate="BI11111",
            seats=5,
        )
        response = self.client.post(
            reverse("token_obtain_pair"),
            {"email": "driver@example.com", "password": "secret123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def create_location(self, name):
        return Location.objects.create(
            user=self.user,
            name=name,
            city="Białystok",
            postal_code="15-001",
            street="Wiejska",
            st_number="1",
            latitude="53.132500",
            longitude="23.168800",
        )

    def test_user_can_add_and_list_own_car(self):
        create_response = self.client.post(
            reverse("my_cars"),
            {
                "brand": "Renault",
                "model": "Clio",
                "license_plate": "BI 12345",
                "seats": 4,
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data["license_plate"], "BI12345")

        list_response = self.client.get(reverse("my_cars"))

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]["brand"], "Renault")
        self.assertEqual(list_response.data[0]["license_plate"], "BI12345")

    def test_car_validation_rejects_invalid_license_plate(self):
        response = self.client.post(
            reverse("my_cars"),
            {
                "brand": "Renault",
                "model": "Clio",
                "license_plate": "??",
                "seats": 4,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("license_plate", response.data)

    def test_car_validation_rejects_invalid_brand_model_and_seats(self):
        response = self.client.post(
            reverse("my_cars"),
            {
                "brand": "A",
                "model": "Clio@",
                "license_plate": "BI12345",
                "seats": 9,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("brand", response.data)
        self.assertIn("model", response.data)
        self.assertIn("seats", response.data)

    def test_car_validation_rejects_duplicate_license_plate_after_normalization(self):
        Car.objects.create(
            owner=self.user,
            brand="Renault",
            model="Clio",
            license_plate="BI12345",
            seats=4,
        )

        response = self.client.post(
            reverse("my_cars"),
            {
                "brand": "Skoda",
                "model": "Fabia",
                "license_plate": "BI 12345",
                "seats": 4,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("license_plate", response.data)

    def test_user_cannot_delete_someone_elses_car(self):
        response = self.client.delete(reverse("delete_car", kwargs={"pk": self.other_car.id}))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_driver_profile_returns_cars(self):
        car = Car.objects.create(
            owner=self.user,
            brand="Skoda",
            model="Fabia",
            license_plate="BI22222",
            seats=4,
        )

        response = self.client.get(reverse("driver_profile", kwargs={"pk": self.user.id}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["cars"]), 1)
        self.assertEqual(response.data["cars"][0]["id"], car.id)
        self.assertEqual(response.data["cars"][0]["license_plate"], "BI22222")

    def test_user_can_update_contact_data_with_valid_values(self):
        response = self.client.patch(
            reverse("user_profile"),
            {
                "first_name": "Anna Maria",
                "last_name": "Nowak-Kowalska",
                "phone": "+48 123 456 789",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Anna Maria")
        self.assertEqual(self.user.last_name, "Nowak-Kowalska")
        self.assertEqual(self.user.phone, "+48123456789")

    def test_user_profile_rejects_invalid_contact_data(self):
        response = self.client.patch(
            reverse("user_profile"),
            {
                "first_name": "J1",
                "last_name": "N",
                "phone": "12-34",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("first_name", response.data)
        self.assertIn("last_name", response.data)
        self.assertIn("phone", response.data)

    def test_user_can_update_address_with_valid_values(self):
        response = self.client.patch(
            reverse("user_profile"),
            {
                "city": "Białystok",
                "postal_code": "15123",
                "street": "Wiejska",
                "st_number": "45A",
                "apt_number": "7",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.city, "Białystok")
        self.assertEqual(self.user.postal_code, "15-123")
        self.assertEqual(self.user.street, "Wiejska")
        self.assertEqual(self.user.st_number, "45A")
        self.assertEqual(self.user.apt_number, "7")

    def test_user_profile_rejects_invalid_address_data(self):
        response = self.client.patch(
            reverse("user_profile"),
            {
                "city": "B1",
                "postal_code": "1234",
                "street": "Wiejska",
                "st_number": "12A",
                "apt_number": "@@",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("city", response.data)
        self.assertIn("postal_code", response.data)
        self.assertIn("apt_number", response.data)

    def test_user_profile_requires_street_and_building_number_together(self):
        response = self.client.patch(
            reverse("user_profile"),
            {
                "city": "Białystok",
                "street": "",
                "st_number": "12A",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("street", response.data)

    def test_user_profile_returns_completed_rides_stats(self):
        today = timezone.localdate()
        past_date = today - timedelta(days=2)
        future_date = today + timedelta(days=2)
        start_location = self.create_location("Start")
        end_location = self.create_location("Meta")

        Ride.objects.create(
            driver=self.user,
            car=Car.objects.create(
                owner=self.user,
                brand="Toyota",
                model="Yaris",
                license_plate="BI33333",
                seats=4,
            ),
            start_location=start_location,
            end_location=end_location,
            departure_date=past_date,
            departure_time="08:00:00",
            cost_per_passenger="20.00",
            available_seats=3,
            status="active",
        )
        Ride.objects.create(
            driver=self.user,
            car=Car.objects.create(
                owner=self.user,
                brand="Honda",
                model="Jazz",
                license_plate="BI44444",
                seats=4,
            ),
            start_location=start_location,
            end_location=end_location,
            departure_date=future_date,
            departure_time="08:00:00",
            cost_per_passenger="20.00",
            available_seats=3,
            status="active",
        )

        passenger_ride = Ride.objects.create(
            driver=self.other_user,
            car=self.other_car,
            start_location=start_location,
            end_location=end_location,
            departure_date=past_date,
            departure_time="10:00:00",
            cost_per_passenger="15.00",
            available_seats=2,
            status="active",
        )
        cancelled_ride = Ride.objects.create(
            driver=self.other_user,
            car=self.other_car,
            start_location=start_location,
            end_location=end_location,
            departure_date=past_date,
            departure_time="12:00:00",
            cost_per_passenger="15.00",
            available_seats=2,
            status="active",
        )
        Booking.objects.create(ride=passenger_ride, passenger=self.user, seat_count=1, status="active")
        Booking.objects.create(ride=cancelled_ride, passenger=self.user, seat_count=1, status="cancelled")

        response = self.client.get(reverse("user_profile"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["stats"]["completed_driver_rides"], 1)
        self.assertEqual(response.data["stats"]["completed_passenger_rides"], 1)
