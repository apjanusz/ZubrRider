from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404  # Dodaj ten import
from .models import Rating, Alert
from .serializers import RatingSerializer
from rides.models import Ride


class CreateRatingView(generics.CreateAPIView):
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        ride_id = self.kwargs.get('ride_id')
        ride = get_object_or_404(Ride, id=ride_id)

        rating = serializer.save(
            rater=self.request.user,
            rated_user=ride.driver,
            ride=ride
        )

        Alert.objects.create(
            user=ride.driver,
            content=f"Otrzymałeś nową ocenę ({rating.score}/5) za przejazd {ride.start_location.city} - {ride.end_location.city}!",
            link=f"/profile",
            is_read=False
        )