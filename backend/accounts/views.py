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


class MyCarsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cars = Car.objects.filter(owner=request.user)
        serializer = CarSerializer(cars, many=True)
        return Response(serializer.data)
