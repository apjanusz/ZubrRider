from rest_framework import serializers
from .models import Ride
from accounts.models import Location, Car
from accounts.serializers import UserSerializer, CarSerializer


# =========================
# Location
# =========================
class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "name", "city", "street", "st_number"]
        extra_kwargs = {
            "name": {"required": False},
        }


# =========================
# Ride – DETAIL / READ
# =========================
class RideDetailSerializer(serializers.ModelSerializer):
    driver = UserSerializer(read_only=True)
    car = CarSerializer(read_only=True)
    start_location = LocationSerializer(read_only=True)
    end_location = LocationSerializer(read_only=True)

    class Meta:
        model = Ride
        fields = [
            "id",
            "driver",
            "car",
            "start_location",
            "end_location",
            "departure_date",
            "departure_time",
            "cost_per_passenger",
            "available_seats",
            "status",
        ]


# =========================
# Ride – CREATE
# =========================
class RideCreateSerializer(serializers.ModelSerializer):
    start_location = LocationSerializer()
    end_location = LocationSerializer()

    class Meta:
        model = Ride
        fields = [
            "start_location",
            "end_location",
            "departure_date",
            "departure_time",
            "cost_per_passenger",
            "available_seats",
        ]

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user

        # --- locations ---
        start_data = validated_data.pop("start_location")
        end_data = validated_data.pop("end_location")

        start_loc = Location.objects.create(
            user=user,
            latitude=0.0,
            longitude=0.0,
            postal_code="00-000",
            **start_data,
        )

        end_loc = Location.objects.create(
            user=user,
            latitude=0.0,
            longitude=0.0,
            postal_code="00-000",
            **end_data,
        )

        # --- car (AUTO by owner) ---
        try:
            car = Car.objects.get(owner=user)
        except Car.DoesNotExist:
            raise serializers.ValidationError(
                {"car": "Użytkownik nie ma przypisanego samochodu"}
            )

        # --- seats validation ---
        if validated_data["available_seats"] > car.seats:
            raise serializers.ValidationError(
                {"available_seats": "Liczba miejsc przekracza pojemność auta"}
            )

        # --- ride ---
        ride = Ride.objects.create(
            driver=user,
            car=car,
            start_location=start_loc,
            end_location=end_loc,
            status="active",
            **validated_data,
        )

        return ride
