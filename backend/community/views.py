from datetime import datetime
from zoneinfo import ZoneInfo

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from django.shortcuts import get_object_or_404  # Dodaj ten import
from .models import Rating, Alert
from .serializers import RatingSerializer
from rides.models import Ride, Booking

RIDE_TIMEZONE = ZoneInfo("Europe/Warsaw")


class CreateRatingView(generics.CreateAPIView):
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        ride_id = self.kwargs.get('ride_id')
        ride = get_object_or_404(Ride, id=ride_id)
        user = self.request.user
        departure_dt = datetime.combine(ride.departure_date, ride.departure_time)
        if timezone.is_naive(departure_dt):
            departure_dt = timezone.make_aware(departure_dt, RIDE_TIMEZONE)

        now_local = timezone.localtime(timezone.now(), RIDE_TIMEZONE)
        if departure_dt >= now_local:
            raise ValidationError({"ride": "Ocena może zostać wystawiona dopiero po zakończeniu przejazdu."})

        if ride.status == "cancelled":
            raise ValidationError({"ride": "Nie można ocenić anulowanego przejazdu."})

        if not Booking.objects.filter(ride=ride, passenger=user, status="active").exists():
            raise ValidationError({"ride": "Ocenić może tylko pasażer, który brał udział w tym przejeździe."})

        if Rating.objects.filter(ride=ride, rater=user).exists():
            raise ValidationError({"ride": "Ten przejazd został już przez Ciebie oceniony."})

        rating = serializer.save(
            rater=user,
            rated_user=ride.driver,
            ride=ride
        )

        Alert.objects.create(
            user=ride.driver,
            content=f"Otrzymałeś nową ocenę ({rating.score}/5) za przejazd {ride.start_location.city} - {ride.end_location.city}!",
            link=f"/profile",
            is_read=False
        )
