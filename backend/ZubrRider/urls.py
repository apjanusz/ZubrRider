"""
URL configuration for ZubrRider project.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from community.views import CreateRatingView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/rides/", include("rides.urls")),  # Dodano routing rides

    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("api-auth/", include("rest_framework.urls")),
path("api/community/", include("community.urls")),
    path('rate/<int:ride_id>/', CreateRatingView.as_view(), name='create-rating'),
]
