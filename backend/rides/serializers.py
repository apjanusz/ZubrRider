from rest_framework import serializers

from .models import Ride
from accounts.models import Location, Car
from accounts.serializers import UserSerializer, CarSerializer
from community.models import Rating
from maps.services import MapsConfigurationError, MapsServiceError, OpenRouteServiceClient


# =========================
# Location
# =========================
class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = [
            "id",
            "name",
            "city",
            "street",
            "st_number",
            "postal_code",
            "latitude",
            "longitude",
        ]
        extra_kwargs = {
            "name": {"required": False},
            "postal_code": {"required": False, "allow_blank": True},
            "latitude": {"required": False},
            "longitude": {"required": False},
        }


# =========================
# Ride – DETAIL / READ
# =========================
class RideDetailSerializer(serializers.ModelSerializer):
    driver = UserSerializer(read_only=True)
    car = CarSerializer(read_only=True)
    start_location = LocationSerializer(read_only=True)
    end_location = LocationSerializer(read_only=True)
    current_user_has_rated = serializers.SerializerMethodField()

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
            "current_user_has_rated",
        ]

    def get_current_user_has_rated(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if not user or not user.is_authenticated:
            return False

        return Rating.objects.filter(ride=obj, rater=user).exists()


# =========================
# Ride – CREATE
# =========================
class RideCreateSerializer(serializers.ModelSerializer):
    car_id = serializers.PrimaryKeyRelatedField(
        source="car",
        queryset=Car.objects.all(),
        write_only=True,
    )
    start_location = LocationSerializer()
    end_location = LocationSerializer()

    class Meta:
        model = Ride
        fields = [
            "car_id",
            "start_location",
            "end_location",
            "departure_date",
            "departure_time",
            "cost_per_passenger",
            "available_seats",
        ]

    def validate(self, attrs):
        request = self.context["request"]
        car = attrs["car"]
        if car.owner_id != request.user.id:
            raise serializers.ValidationError(
                {"car_id": "Wybrany pojazd nie należy do użytkownika"}
            )
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user
        car = validated_data.pop("car")

        start_data = validated_data.pop("start_location")
        end_data = validated_data.pop("end_location")

        start_loc = self._create_location(user=user, location_data=start_data)
        end_loc = self._create_location(user=user, location_data=end_data)

        if validated_data["available_seats"] > car.seats:
            raise serializers.ValidationError(
                {"available_seats": "Liczba miejsc przekracza pojemność auta"}
            )

        ride = Ride.objects.create(
            driver=user,
            car=car,
            start_location=start_loc,
            end_location=end_loc,
            status="active",
            **validated_data,
        )

        return ride

    def _create_location(self, *, user, location_data):
        location_data = location_data.copy()
        latitude = location_data.pop("latitude", None)
        longitude = location_data.pop("longitude", None)

        if latitude is None or longitude is None:
            geocoded = self._geocode_location(location_data)
            latitude = geocoded["latitude"]
            longitude = geocoded["longitude"]
            location_data["postal_code"] = location_data.get("postal_code") or geocoded.get(
                "postal_code", ""
            )

        location_data["postal_code"] = location_data.get("postal_code") or ""

        return Location.objects.create(
            user=user,
            latitude=latitude,
            longitude=longitude,
            **location_data,
        )

    def _geocode_location(self, location_data):
        query_parts = [
            location_data.get("street"),
            location_data.get("st_number"),
            location_data.get("city"),
            location_data.get("postal_code"),
            "Poland",
        ]
        query = " ".join(str(part).strip() for part in query_parts if part)

        try:
            client = OpenRouteServiceClient()
            results = client.geocode(query=query, size=1, country_code="PL")
        except MapsConfigurationError as exc:
            raise serializers.ValidationError(
                {"location": f"Konfiguracja map jest niekompletna: {exc}"}
            ) from exc
        except MapsServiceError as exc:
            raise serializers.ValidationError(
                {"location": f"Nie udało się zgeokodować adresu: {exc}"}
            ) from exc

        if not results:
            raise serializers.ValidationError(
                {"location": f"Nie znaleziono współrzędnych dla adresu: {query}"}
            )

        return results[0]
