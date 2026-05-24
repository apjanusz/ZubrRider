from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Car


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
