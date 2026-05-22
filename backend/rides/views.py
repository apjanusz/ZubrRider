from django.shortcuts import get_object_or_404
from rest_framework import generics, views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Ride, Booking
from .serializers import RideDetailSerializer, RideCreateSerializer


class RideDetailView(generics.RetrieveAPIView):
    queryset = Ride.objects.all()
    serializer_class = RideDetailSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "pk"


class RideCreateView(generics.CreateAPIView):
    queryset = Ride.objects.all()
    serializer_class = RideCreateSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        self.perform_create(serializer)
        return Response(RideDetailSerializer(serializer.instance).data, status=201)


class MyRidesView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Przejazdy gdzie użytkownik jest kierowcą (zostawiamy bez zmian lub sortujemy)
        driver_rides = Ride.objects.filter(driver=user).order_by("departure_date", "departure_time")

        passenger_rides = (
            Ride.objects.filter(
                bookings__passenger=user,
                bookings__status="active"
            )
            .distinct()
            .order_by("departure_date", "departure_time")
        )

        return Response(
            {
                "as_driver": RideDetailSerializer(driver_rides, many=True).data,
                "as_passenger": RideDetailSerializer(passenger_rides, many=True).data,
            }
        )
class RideListView(generics.ListAPIView):
    queryset = Ride.objects.filter(status="active").order_by("departure_date", "departure_time")
    serializer_class = RideDetailSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class BookRideView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ride = get_object_or_404(Ride, pk=pk)

        # Sprawdzamy czy kierowca nie próbuje zarezerwować własnego przejazdu
        if ride.driver == request.user:
            return Response({"error": "Nie możesz zarezerwować własnego przejazdu."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Sprawdzamy dostępne miejsca
        if ride.available_seats < 1:
            return Response({"error": "Brak wolnych miejsc na ten przejazd."}, status=status.HTTP_400_BAD_REQUEST)

        # Sprawdzamy, czy już nie zarezerwował
        if Booking.objects.filter(ride=ride, passenger=request.user, status="active").exists():
            return Response({"error": "Masz już aktywną rezerwację na ten przejazd."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Tworzymy rezerwację i zmniejszamy liczbę miejsc
        Booking.objects.create(ride=ride, passenger=request.user, seat_count=1, status="active")
        ride.available_seats -= 1
        ride.save()

        return Response({"message": "Zarezerwowano pomyślnie!"}, status=status.HTTP_201_CREATED)


class CancelBookingView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ride = get_object_or_404(Ride, pk=pk)
        booking = Booking.objects.filter(ride=ride, passenger=request.user, status="active").first()

        if not booking:
            return Response({"error": "Nie masz aktywnej rezerwacji na ten przejazd."},
                            status=status.HTTP_400_BAD_REQUEST)

        booking.status = "cancelled"
        booking.save()
        ride.available_seats += 1
        ride.save()

        return Response({"message": "Rezerwacja została anulowana."}, status=status.HTTP_200_OK)
