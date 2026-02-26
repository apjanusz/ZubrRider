from django.conf import settings
from django.db import models

from accounts.models import Car, Location, Wallet


# Create your models here.

class Ride(models.Model):
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rides_as_driver')
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='rides')
    start_location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='ride_starts')
    end_location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='ride_ends')
    departure_date = models.DateField()
    departure_time = models.TimeField()
    cost_per_passenger = models.DecimalField(max_digits=10, decimal_places=2)
    available_seats = models.IntegerField()
    status = models.CharField(max_length=20, default="active")


    def __str__(self):
        return f"{self.driver } {self.car} {self.start_location}"

class Stop(models.Model):
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='stops')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='stops_on_rides')
    order = models.IntegerField()

    def __str__(self):
        return f"{self.ride} {self.location} {self.order}"

class Booking(models.Model):
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='bookings')
    passenger = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    seat_count = models.IntegerField(default=1)
    status = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.ride} {self.passenger} {self.seat_count}"

class Transaction(models.Model):
    source_wallet = models.ForeignKey(Wallet, on_delete=models.SET_NULL, null=True, blank=True, related_name='outgoing_transactions')
    target_wallet = models.ForeignKey(Wallet, on_delete=models.SET_NULL, null=True, blank=True, related_name='incoming_transactions')
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=20)
    transaction_date = models.DateField()
    transaction_time = models.TimeField()

    def __str__(self):
        return f"{self.source_wallet} {self.target_wallet} {self.booking} {self.amount} {self.type} {self.transaction_date} {self.transaction_time}"