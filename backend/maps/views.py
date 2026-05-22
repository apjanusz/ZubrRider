from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import GeocodeQuerySerializer, RouteRequestSerializer
from .services import MapsConfigurationError, MapsServiceError, OpenRouteServiceClient


class GeocodeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        serializer = GeocodeQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        try:
            client = OpenRouteServiceClient()
            results = client.geocode(**serializer.validated_data, autocomplete=True, country_code="PL")
        except MapsConfigurationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except MapsServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({"results": results}, status=status.HTTP_200_OK)


class RouteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RouteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            client = OpenRouteServiceClient()
            route = client.route(**serializer.validated_data)
        except MapsConfigurationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except MapsServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(route, status=status.HTTP_200_OK)
