from django.urls import path
from .views import RideDetailView, RideCreateView, MyRidesView

urlpatterns = [
    # Tworzenie przejazdu
    path("create/", RideCreateView.as_view(), name="ride_create"),
    # Moje przejazdy (dashboard)
    path("my-rides/", MyRidesView.as_view(), name="my_rides"),
    # Szczegóły przejazdu
    path("<int:pk>/", RideDetailView.as_view(), name="ride_detail"),
]
