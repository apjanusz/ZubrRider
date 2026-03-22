from rest_framework import serializers
from .models import User, Car

# Importujemy modele z innych aplikacji wewnątrz metod lub na górze, jeśli nie ma cyklu
from community.models import Rating
from rides.models import Ride


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


from rest_framework import serializers
from django.db.models import Avg
from .models import User, Car
from community.models import Rating
from rides.models import Ride


class UserSerializer(serializers.ModelSerializer):
    # Musisz jawnie zdefiniować to pole tutaj:
    stats = serializers.SerializerMethodField()

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

    def get_stats(self, obj):
        rides_count = Ride.objects.filter(driver=obj).count()
        ratings = Rating.objects.filter(rated_user=obj)

        avg_rating = 0
        if ratings.exists():
            avg_rating = round(ratings.aggregate(Avg('score'))['score__avg'], 1)

        return {
            "rides_count": rides_count,
            "rating_avg": avg_rating,
            "rating_count": ratings.count(),
        }
class CarSerializer(serializers.ModelSerializer):
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
