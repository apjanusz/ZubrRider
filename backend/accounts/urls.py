from django.urls import path
from .views import RegisterView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # rejestracja
    # POST /api/accounts/register/
    path('register/', RegisterView.as_view(), name='auth_register'),

    # logowanie
    # POST /api/accounts/token/
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),

    # token reset
    # POST /api/accounts/token/refresh/
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]