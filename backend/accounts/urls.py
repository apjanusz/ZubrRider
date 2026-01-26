from django.urls import path
from .views import RegisterView, UserProfileView, DriverProfileView, MyCarsView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # rejestracja
    path("register/", RegisterView.as_view(), name="auth_register"),
    # logowanie
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    # token reset
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # profil prywatny
    path("me/", UserProfileView.as_view(), name="user_profile"),
    # profil kierowcy (publiczny)
    path("driver/<int:pk>/", DriverProfileView.as_view(), name="driver_profile"),
    # moje samochody (do listy rozwijanej)
    path("my-cars/", MyCarsView.as_view(), name="my_cars"),
]
