from django.conf import settings
from django.db import models

# Create your models here.
class Bonus(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} {self.description}"

class UserBonus(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bonuses')
    bonus = models.ForeignKey(Bonus, on_delete=models.CASCADE, related_name='granted_to')
    granted_at = models.DateField()
    expires_at = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} {self.bonus}"