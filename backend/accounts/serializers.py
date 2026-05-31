import re

from django.db.models import Avg
from django.utils import timezone
from rest_framework import serializers
from .models import User, Car

# Importujemy modele z innych aplikacji wewnątrz metod lub na górze, jeśli nie ma cyklu
from community.models import Rating
from rides.models import Booking, Ride


class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={"input_type": "password"}, write_only=True)

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "phone",
            "city",
            "postal_code",
            "street",
            "st_number",
            "apt_number",
            "first_name",
            "last_name",
            "password",
            "password2",
        ]
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError("Passwords must match.")
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    # Musisz jawnie zdefiniować to pole tutaj:
    stats = serializers.SerializerMethodField()
    name_pattern = re.compile(r"^[A-Za-zÀ-ÿĄąĆćĘęŁłŃńÓóŚśŹźŻż\s-]+$")
    city_pattern = re.compile(r"^[A-Za-zÀ-ÿĄąĆćĘęŁłŃńÓóŚśŹźŻż\s'-]+$")
    street_pattern = re.compile(r"^[A-Za-zÀ-ÿĄąĆćĘęŁłŃńÓóŚśŹźŻż0-9\s.'-]+$")
    building_pattern = re.compile(r"^[0-9A-Za-z/]+$")

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "city",
            "postal_code",
            "street",
            "st_number",
            "apt_number",
            "date_joined",
            "last_login",
            "stats",  # Teraz to pole będzie poprawne
        ]
        read_only_fields = ["id", "email", "date_joined", "last_login"]

    def validate_first_name(self, value):
        value = value.strip()
        if len(value) < 2 or len(value) > 50:
            raise serializers.ValidationError("Imię musi mieć od 2 do 50 znaków.")
        if not self.name_pattern.fullmatch(value):
            raise serializers.ValidationError("Imię może zawierać tylko litery, spacje i myślniki.")
        return value

    def validate_last_name(self, value):
        value = value.strip()
        if len(value) < 2 or len(value) > 80:
            raise serializers.ValidationError("Nazwisko musi mieć od 2 do 80 znaków.")
        if not self.name_pattern.fullmatch(value):
            raise serializers.ValidationError("Nazwisko może zawierać tylko litery, spacje i myślniki.")
        return value

    def validate_phone(self, value):
        normalized = re.sub(r"[\s()-]+", "", value or "")
        if not normalized:
            return ""
        if normalized.startswith("+"):
            digits = normalized[1:]
            if not digits.isdigit():
                raise serializers.ValidationError("Podaj poprawny numer telefonu.")
            normalized = f"+{digits}"
        elif not normalized.isdigit():
            raise serializers.ValidationError("Podaj poprawny numer telefonu.")
        digit_count = len(normalized[1:] if normalized.startswith("+") else normalized)
        if digit_count < 9 or digit_count > 15:
            raise serializers.ValidationError("Podaj poprawny numer telefonu.")
        return normalized

    def validate_city(self, value):
        value = value.strip()
        if len(value) < 2 or len(value) > 100:
            raise serializers.ValidationError("Miasto musi mieć od 2 do 100 znaków.")
        if not self.city_pattern.fullmatch(value):
            raise serializers.ValidationError("Miasto może zawierać tylko litery, spacje, apostrof i myślnik.")
        return value

    def validate_postal_code(self, value):
        normalized = re.sub(r"\s+", "", value or "")
        if not normalized:
            return ""
        if re.fullmatch(r"\d{5}", normalized):
            normalized = f"{normalized[:2]}-{normalized[2:]}"
        if not re.fullmatch(r"\d{2}-\d{3}", normalized):
            raise serializers.ValidationError("Kod pocztowy musi mieć format 00-000.")
        return normalized

    def validate_street(self, value):
        value = value.strip()
        if not value:
            return ""
        if len(value) < 2 or len(value) > 150:
            raise serializers.ValidationError("Ulica musi mieć od 2 do 150 znaków.")
        if not self.street_pattern.fullmatch(value):
            raise serializers.ValidationError("Ulica zawiera niedozwolone znaki.")
        return value

    def validate_st_number(self, value):
        value = value.strip()
        if not value:
            return ""
        if len(value) > 10 or not self.building_pattern.fullmatch(value):
            raise serializers.ValidationError("Podaj poprawny numer domu.")
        return value

    def validate_apt_number(self, value):
        value = value.strip()
        if not value:
            return ""
        if len(value) > 10 or not self.building_pattern.fullmatch(value):
            raise serializers.ValidationError("Podaj poprawny numer lokalu.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        street = attrs.get("street", getattr(self.instance, "street", ""))
        st_number = attrs.get("st_number", getattr(self.instance, "st_number", ""))

        if street and not st_number:
            raise serializers.ValidationError({"st_number": "Podaj numer domu dla wskazanej ulicy."})
        if st_number and not street:
            raise serializers.ValidationError({"street": "Podaj ulicę dla wskazanego numeru domu."})
        return attrs

    def get_stats(self, obj):
        today = timezone.localdate()
        rides_count = Ride.objects.filter(driver=obj).count()
        completed_driver_rides = (
            Ride.objects.filter(driver=obj, departure_date__lt=today)
            .exclude(status="cancelled")
            .count()
        )
        completed_passenger_rides = (
            Booking.objects.filter(
                passenger=obj,
                status="active",
                ride__departure_date__lt=today,
            )
            .exclude(ride__status="cancelled")
            .values("ride_id")
            .distinct()
            .count()
        )
        ratings = Rating.objects.filter(rated_user=obj)

        avg_rating = 0
        if ratings.exists():
            avg_rating = round(ratings.aggregate(Avg('score'))['score__avg'], 1)

        return {
            "rides_count": rides_count,
            "completed_driver_rides": completed_driver_rides,
            "completed_passenger_rides": completed_passenger_rides,
            "rating_avg": avg_rating,
            "rating_count": ratings.count(),
        }
class CarSerializer(serializers.ModelSerializer):
    def validate_brand(self, value):
        value = value.strip()
        if len(value) < 2 or len(value) > 50:
            raise serializers.ValidationError("Marka musi mieć od 2 do 50 znaków.")
        if not re.fullmatch(r"[A-Za-zÀ-ÿĄąĆćĘęŁłŃńÓóŚśŹźŻż0-9\s-]+", value):
            raise serializers.ValidationError("Marka może zawierać tylko litery, cyfry, spacje i myślniki.")
        return value

    def validate_model(self, value):
        value = value.strip()
        if len(value) < 1 or len(value) > 50:
            raise serializers.ValidationError("Model musi mieć od 1 do 50 znaków.")
        if not re.fullmatch(r"[A-Za-zÀ-ÿĄąĆćĘęŁłŃńÓóŚśŹźŻż0-9\s-]+", value):
            raise serializers.ValidationError("Model może zawierać tylko litery, cyfry, spacje i myślniki.")
        return value

    def validate_license_plate(self, value):
        normalized = re.sub(r"\s+", "", value).upper()
        if not re.fullmatch(r"[A-Z0-9]{4,8}", normalized):
            raise serializers.ValidationError(
                "Numer rejestracyjny musi mieć od 4 do 8 znaków alfanumerycznych."
            )
        existing = Car.objects.filter(license_plate=normalized)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("Pojazd z takim numerem rejestracyjnym już istnieje.")
        return normalized

    def validate_seats(self, value):
        if value < 1 or value > 8:
            raise serializers.ValidationError("Liczba miejsc musi być w zakresie od 1 do 8.")
        return value

    class Meta:
        model = Car
        fields = ["id", "brand", "model", "license_plate", "seats"]
        read_only_fields = ["owner"]


class DriverReviewSerializer(serializers.ModelSerializer):
    rater_name = serializers.ReadOnlyField(source="rater.first_name")

    class Meta:
        model = Rating
        fields = ["score", "comment", "rater_name"]


class DriverProfileSerializer(serializers.ModelSerializer):
    cars = CarSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "username",
            "date_joined",
            "city",  # Tylko miasto, bez dokładnego adresu
            "cars",
            "reviews",
            "stats",
        ]

    def get_reviews(self, obj):
        # Pobieramy opinie, gdzie ten użytkownik był oceniany (rated_user)
        # Ograniczamy np. do ostatnich 10
        ratings = Rating.objects.filter(rated_user=obj).order_by("-id")[:10]
        return DriverReviewSerializer(ratings, many=True).data

    def get_stats(self, obj):
        # Obliczanie statystyk w locie
        rides_count = Ride.objects.filter(driver=obj).count()
        ratings = Rating.objects.filter(rated_user=obj)
        avg_rating = 0
        if ratings.exists():
            total_score = sum(r.score for r in ratings)
            avg_rating = round(total_score / ratings.count(), 1)

        return {
            "rides_count": rides_count,
            "rating_avg": avg_rating,
            "rating_count": ratings.count(),
        }
