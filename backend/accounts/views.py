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

        print("CAR SERIALIZER ERRORS:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        car = get_object_or_404(Car, id=pk, owner=request.user)
        car.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)