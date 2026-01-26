from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Adres email jest wymagany')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser musi mieć is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser musi mieć is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

# --- 2. Twój model User z podpiętym Managerem ---
class User(AbstractUser):
    # Username może zostać jako pole opcjonalne, ale nie służy do logowania
    username = models.CharField(max_length=50, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=10, blank=True)
    street = models.CharField(max_length=150, blank=True)
    st_number = models.CharField(max_length=10, blank=True)
    apt_number = models.CharField(max_length=10, blank=True)

    # To mówi Django: używaj tego managera zamiast domyślnego
    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = [] # Username nie jest wymagany

    def __str__(self):
        return self.email

# --- Reszta modeli bez zmian ---
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