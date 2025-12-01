from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import User
from .serializers import UserRegistrationSerializer

# Create your views here.

class RegisterView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer
