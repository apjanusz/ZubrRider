from rest_framework import serializers
from .models import Rating

class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['score', 'comment']

    def validate_score(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Ocena musi być między 1 a 5.")
        return value