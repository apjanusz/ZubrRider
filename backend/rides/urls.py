from django.urls import path
from .views import RideDetailView, RideCreateView, MyRidesView, RideListView, BookRideView, CancelBookingView, DeleteRideView

urlpatterns = [
    # Listowanie przejazdów
    path("", RideListView.as_view(), name="ride_list"),
    # Tworzenie przejazdu
    path("create/", RideCreateView.as_view(), name="ride_create"),
    # Moje przejazdy (dashboard)
    path("my-rides/", MyRidesView.as_view(), name="my_rides"),
    # Szczegóły przejazdu
    path("<int:pk>/", RideDetailView.as_view(), name="ride_detail"),
    # Bookowanie przejazdu
    path("<int:pk>/book/", BookRideView.as_view(), name="ride_book"),
    # Anulowanie przejazdu
    path("<int:pk>/cancel/", CancelBookingView.as_view(), name="ride_cancel"),
    # Usunięcie przejazdu przez kierowcę
    path("<int:pk>/delete/", DeleteRideView.as_view(), name="ride_delete"),
]
