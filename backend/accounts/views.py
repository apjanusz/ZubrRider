import calendar
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import User, Car
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    DriverProfileSerializer,
    CarSerializer,
)
from rest_framework import views, status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Car
from .serializers import CarSerializer

# Create your views here.


class RegisterView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class DriverProfileView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DriverProfileSerializer
    queryset = User.objects.all()
    lookup_field = "pk"


class MyCarsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        cars = Car.objects.filter(owner=user)
        serializer = CarSerializer(cars, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CarSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        car = get_object_or_404(Car, id=pk, owner=request.user)
        car.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DriverCardView(APIView):
    permission_classes = [IsAuthenticated]

    REQUIRED_RIDES = 10

    def get(self, request):
        from rides.models import Ride

        user = request.user
        now = timezone.localtime()
        today = now.date()
        current_time = now.time()

        current_year = today.year
        current_month = today.month

        if current_month == 1:
            prev_year = current_year - 1
            prev_month = 12
        else:
            prev_year = current_year
            prev_month = current_month - 1

        rides_this_month = Ride.objects.filter(
            driver=user,
            departure_date__year=current_year,
            departure_date__month=current_month,
        ).exclude(
            status="cancelled"
        ).filter(
            Q(departure_date__lt=today) |
            Q(departure_date=today, departure_time__lte=current_time)
        ).count()

        rides_last_month = Ride.objects.filter(
            driver=user,
            departure_date__year=prev_year,
            departure_date__month=prev_month,
        ).exclude(status="cancelled").count()

        eligible = False
        valid_from = None
        valid_until = None

        if rides_this_month >= self.REQUIRED_RIDES:
            eligible = True
            valid_from = today.replace(day=1)
            if current_month == 12:
                next_year, next_month = current_year + 1, 1
            else:
                next_year, next_month = current_year, current_month + 1
            last_day = calendar.monthrange(next_year, next_month)[1]
            valid_until = today.replace(year=next_year, month=next_month, day=last_day)
        elif rides_last_month >= self.REQUIRED_RIDES:
            eligible = True
            valid_from = today.replace(year=prev_year, month=prev_month, day=1)
            last_day = calendar.monthrange(current_year, current_month)[1]
            valid_until = today.replace(day=last_day)

        return Response({
            "eligible": eligible,
            "rides_this_month": rides_this_month,
            "rides_last_month": rides_last_month,
            "required_rides": self.REQUIRED_RIDES,
            "valid_from": valid_from.isoformat() if valid_from else None,
            "valid_until": valid_until.isoformat() if valid_until else None,
        })
