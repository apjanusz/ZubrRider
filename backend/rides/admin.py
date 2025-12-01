from django.contrib import admin
from .models import Ride, Stop, Booking, Transaction

# Register your models here.

class RideAdmin(admin.ModelAdmin):
    list_display = ('id', 'driver', 'start_location', 'end_location', 'departure_date', 'status', 'available_seats')
    list_filter = ('status', 'departure_date')
    search_fields = ('id', 'driver__email', 'start_location__city', 'end_location__city')
    # Automatycznie uzupełnia daty
    date_hierarchy = 'departure_date'

class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'passenger', 'ride', 'seat_count', 'status')
    list_filter = ('status',)
    search_fields = ('id', 'passenger__email', 'ride__id')

class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'type', 'amount', 'source_wallet', 'target_wallet', 'booking', 'transaction_date')
    list_filter = ('type',)
    date_hierarchy = 'transaction_date'

admin.site.register(Ride, RideAdmin)
admin.site.register(Booking, BookingAdmin)
admin.site.register(Transaction, TransactionAdmin)
admin.site.register(Stop)