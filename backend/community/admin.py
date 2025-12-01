from django.contrib import admin
from .models import Rating, Message, Alert

# Register your models here.

admin.site.register(Rating)
admin.site.register(Message)
admin.site.register(Alert)