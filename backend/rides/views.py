from rest_framework import generics, views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Ride
from .serializers import RideDetailSerializer, RideCreateSerializer

# Create your views here.


class RideDetailView(generics.RetrieveAPIView):
    queryset = Ride.objects.all()
    serializer_class = RideDetailSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "pk"


class RideCreateView(generics.CreateAPIView):
    queryset = Ride.objects.all()
    serializer_class = RideCreateSerializer
    permission_classes = [IsAuthenticated]


class MyRidesView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # 1. Przejazdy, gdzie jestem kierowcą
        driver_rides = Ride.objects.filter(driver=user).order_by("-departure_date")

        # 2. Przejazdy, gdzie jestem pasażerem (mam rezerwację)
        # Relacja 'bookings' w modelu Ride prowadzi do modelu Booking, który ma pole 'passenger'
        passenger_rides = (
            Ride.objects.filter(bookings__passenger=user)
            .distinct()
            .order_by("-departure_date")
        )

        return Response(
            {
                "as_driver": RideDetailSerializer(driver_rides, many=True).data,
                "as_passenger": RideDetailSerializer(passenger_rides, many=True).data,
            }
        )
