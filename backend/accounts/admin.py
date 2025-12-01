from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Car, Location, Wallet, BankAccount


class CustomUserAdmin(UserAdmin):
    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),
        ('Dane Personalne', {
            'fields': ('username', 'first_name', 'last_name', 'phone')
        }),
        ('Adres', {
            'fields': ('city', 'postal_code', 'street', 'st_number', 'apt_number')
        }),
        ('Uprawnienia', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Ważne daty', {
            'fields': ('last_login', 'date_joined')
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'password', 'password2',
                'username', 'phone', 'first_name', 'last_name',
                'city', 'postal_code', 'street', 'st_number', 'apt_number'
            ),
        }),
    )

    list_display = ('email', 'username', 'phone', 'is_staff')

    search_fields = ('email', 'username', 'phone')

    ordering = ('email',)


class CarAdmin(admin.ModelAdmin):
    list_display = ('owner', 'brand', 'model', 'license_plate', 'seats')
    search_fields = ('license_plate', 'brand', 'model', 'owner__email')
    list_filter = ('brand', 'model')


class LocationAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'city', 'street', 'st_number')
    search_fields = ('user__email', 'name', 'city')


class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance')
    search_fields = ('user__email',)
    readonly_fields = ('balance',)


class BankAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'account_holder_name', 'iban')
    search_fields = ('user__email', 'account_holder_name')


admin.site.register(User, CustomUserAdmin)
admin.site.register(Car, CarAdmin)
admin.site.register(Location, LocationAdmin)
admin.site.register(Wallet, WalletAdmin)
admin.site.register(BankAccount, BankAccountAdmin)