from django.urls import path
from .views import CreateRatingView

urlpatterns = [
    path('rate/<int:ride_id>/', CreateRatingView.as_view(), name='create-rating'),
]