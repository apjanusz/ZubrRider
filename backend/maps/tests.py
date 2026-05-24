from unittest.mock import Mock, patch

from django.core.cache import cache
from django.test import SimpleTestCase
from rest_framework.test import APIClient

from maps.services import MapsNoResultsError, OpenRouteServiceClient, build_cache_key


class MapsApiTests(SimpleTestCase):
    def setUp(self):
        self.client = APIClient()
        cache.clear()

    @patch("maps.views.OpenRouteServiceClient")
    def test_geocode_endpoint_returns_results(self, client_cls):
        client_cls.return_value.geocode.return_value = [
            {
                "label": "Bialystok, Poland",
                "name": "Bialystok",
                "country": "Poland",
                "region": "Podlaskie",
                "locality": "Bialystok",
                "street": "",
                "postal_code": "",
                "latitude": 53.1325,
                "longitude": 23.1688,
            }
        ]

        response = self.client.get("/api/maps/geocode/", {"query": "Bialystok"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
        client_cls.return_value.geocode.assert_called_once_with(
            query="Bialystok", size=5, autocomplete=True, country_code="PL"
        )

    @patch("maps.views.OpenRouteServiceClient")
    def test_geocode_endpoint_returns_provider_error(self, client_cls):
        client_cls.return_value.geocode.side_effect = MapsNoResultsError("Brak wyników")

        response = self.client.get("/api/maps/geocode/", {"query": "Nieistniejace miejsce"})

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.data["detail"], "Brak wyników")

    @patch("maps.views.OpenRouteServiceClient")
    def test_route_endpoint_returns_route_summary(self, client_cls):
        client_cls.return_value.route.return_value = {
            "distance_m": 1000,
            "duration_s": 120,
            "geometry": {"type": "LineString", "coordinates": [[23.1, 53.1], [23.2, 53.2]]},
        }

        response = self.client.post(
            "/api/maps/route/",
            {
                "start": {"latitude": 53.1, "longitude": 23.1},
                "end": {"latitude": 53.2, "longitude": 23.2},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["distance_m"], 1000)


class MapsServiceCacheTests(SimpleTestCase):
    def setUp(self):
        cache.clear()

    def test_build_cache_key_hashes_non_ascii_payload(self):
        cache_key = build_cache_key("geocode", "białystok wiejska 45:5:True:PL")

        self.assertTrue(cache_key.startswith("maps:geocode:"))
        self.assertRegex(cache_key, r"^maps:geocode:[0-9a-f]{64}$")

    @patch("maps.services.requests.get")
    def test_geocode_uses_cache_for_same_query(self, mock_get):
        mock_response = Mock()
        mock_response.json.return_value = {
            "features": [
                {
                    "geometry": {"coordinates": [23.1688, 53.1325]},
                    "properties": {"label": "Bialystok, Poland"},
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        client = OpenRouteServiceClient()

        first = client.geocode(
            "Bialystok",
            size=1,
            autocomplete=True,
            country_code="PL",
        )
        second = client.geocode(
            "Bialystok",
            size=1,
            autocomplete=True,
            country_code="PL",
        )

        self.assertEqual(first, second)
        self.assertEqual(mock_get.call_count, 1)
        self.assertEqual(mock_get.call_args.kwargs["params"]["boundary.country"], "PL")

    @patch("maps.services.requests.post")
    def test_route_uses_cache_for_same_coordinates(self, mock_post):
        mock_response = Mock()
        mock_response.json.return_value = {
            "features": [
                {
                    "geometry": {"type": "LineString", "coordinates": [[23.1, 53.1], [23.2, 53.2]]},
                    "properties": {"summary": {"distance": 1000, "duration": 120}},
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        client = OpenRouteServiceClient()
        start = {"latitude": 53.1, "longitude": 23.1}
        end = {"latitude": 53.2, "longitude": 23.2}

        first = client.route(start, end)
        second = client.route(start, end)

        self.assertEqual(first, second)
        self.assertEqual(mock_post.call_count, 1)
