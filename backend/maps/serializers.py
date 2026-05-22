from rest_framework import serializers


class GeocodeQuerySerializer(serializers.Serializer):
    query = serializers.CharField(max_length=255)
    size = serializers.IntegerField(min_value=1, max_value=10, required=False, default=5)


class CoordinateSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()


class RouteRequestSerializer(serializers.Serializer):
    start = CoordinateSerializer()
    end = CoordinateSerializer()
