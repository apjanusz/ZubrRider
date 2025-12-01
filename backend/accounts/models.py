from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

# Create your models here.

class User(AbstractUser):
    username = models.CharField(max_length=50, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=10, blank=True)
    street = models.CharField(max_length=150, blank=True)
    st_number = models.CharField(max_length=10, blank=True)
    apt_number = models.CharField(max_length=10, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

class Car(models.Model):
    owner = models.ForeignKey('User', on_delete=models.CASCADE, related_name='cars')
    brand = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    license_plate = models.CharField(max_length=8, unique=True)
    seats = models.IntegerField()

    def __str__(self):
        return f"{self.owner} {self.brand} {self.model} {self.license_plate}"

class Location(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='locations')
    name = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=10)
    street = models.CharField(max_length=150)
    st_number = models.CharField(max_length=10)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    def __str__(self):
        return f"{self.name} {self.city} {self.street} {self.st_number} {self.latitude} {self.longitude}"

class Wallet(models.Model):
    user = models.OneToOneField('User', on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.user.email} - {self.balance}"

class BankAccount(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='bank_accounts')
    iban = models.CharField(max_length=34)
    account_holder_name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.user.email} - {self.account_holder_name}"