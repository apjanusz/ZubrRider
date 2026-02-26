from rest_framework import generics, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Ride
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
            print("❌ SERIALIZER ERRORS:", serializer.errors)
            return Response(serializer.errors, status=400)

        self.perform_create(serializer)
        return Response(serializer.data, status=201)



class MyRidesView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        driver_rides = Ride.objects.filter(driver=user).order_by("-departure_date")
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
