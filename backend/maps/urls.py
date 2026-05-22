from django.urls import path

from .views import GeocodeView, RouteView


urlpatterns = [
    path("geocode/", GeocodeView.as_view(), name="maps_geocode"),
    path("route/", RouteView.as_view(), name="maps_route"),
]
