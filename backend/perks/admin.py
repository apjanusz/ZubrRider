from django.contrib import admin

from perks.models import Bonus, UserBonus


# Register your models here.

class BonusAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

class UserBonusAdmin(admin.ModelAdmin):
    list_display = ('user', 'bonus', 'granted_at', 'expires_at')
    list_filter = ('bonus', 'expires_at')

admin.site.register(Bonus, BonusAdmin)
admin.site.register(UserBonus, UserBonusAdmin)