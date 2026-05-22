from typing import Any

import requests
from django.conf import settings
from django.core.cache import cache


def build_cache_key(prefix: str, payload: str) -> str:
    return f"maps:{prefix}:{payload}"


class MapsServiceError(Exception):
    pass


class MapsConfigurationError(MapsServiceError):
    pass


class MapsNoResultsError(MapsServiceError):
    pass


class OpenRouteServiceClient:
    base_url = "https://api.openrouteservice.org"
    timeout = 10

    def __init__(self) -> None:
        self.api_key = settings.ORS_API_KEY
        if not self.api_key:
            raise MapsConfigurationError("ORS_API_KEY is not configured.")

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": self.api_key,
            "Accept": "application/json, application/geo+json",
            "Content-Type": "application/json",
        }

    def geocode(
        self,
        query: str,
        size: int = 5,
        *,
        autocomplete: bool = False,
        country_code: str | None = None,
    ) -> list[dict[str, Any]]:
        cache_key = build_cache_key(
            "geocode",
            f"{query.lower().strip()}:{size}:{autocomplete}:{country_code or ''}",
        )
        cached_results = cache.get(cache_key)
        if cached_results is not None:
            return cached_results

        results = self._geocode_request(
            query=query,
            size=size,
            autocomplete=autocomplete,
            country_code=country_code,
        )
        if not results and autocomplete:
            results = self._geocode_request(
                query=query,
                size=size,
                autocomplete=False,
                country_code=country_code,
            )

        cache.set(cache_key, results, timeout=settings.MAPS_GEOCODE_CACHE_TIMEOUT)
        return results

    def _geocode_request(
        self,
        *,
        query: str,
        size: int,
        autocomplete: bool,
        country_code: str | None,
    ) -> list[dict[str, Any]]:
        params = {"text": query, "size": size}
        if country_code:
            params["boundary.country"] = country_code

        response = requests.get(
            f"{self.base_url}/geocode/{'autocomplete' if autocomplete else 'search'}",
            headers=self._headers(),
            params=params,
            timeout=self.timeout,
        )
        self._raise_for_status(response)

        features = response.json().get("features", [])
        results = []
        for feature in features:
            geometry = feature.get("geometry", {})
            coordinates = geometry.get("coordinates", [])
            properties = feature.get("properties", {})
            if len(coordinates) != 2:
                continue

            results.append(
                {
                    "label": properties.get("label") or properties.get("name") or query,
                    "name": properties.get("name") or "",
                    "country": properties.get("country") or "",
                    "region": properties.get("region") or "",
                    "locality": properties.get("locality") or "",
                    "street": properties.get("street") or "",
                    "postal_code": properties.get("postalcode") or "",
                    "latitude": coordinates[1],
                    "longitude": coordinates[0],
                }
            )

        return results

    def route(self, start: dict[str, float], end: dict[str, float]) -> dict[str, Any]:
        cache_key = build_cache_key(
            "route",
            ":".join(
                [
                    f"{start['latitude']:.6f}",
                    f"{start['longitude']:.6f}",
                    f"{end['latitude']:.6f}",
                    f"{end['longitude']:.6f}",
                ]
            ),
        )
        cached_route = cache.get(cache_key)
        if cached_route is not None:
            return cached_route

        response = requests.post(
            f"{self.base_url}/v2/directions/driving-car/geojson",
            headers=self._headers(),
            json={
                "coordinates": [
                    [start["longitude"], start["latitude"]],
                    [end["longitude"], end["latitude"]],
                ]
            },
            timeout=self.timeout,
        )
        self._raise_for_status(response)

        data = response.json()
        feature = (data.get("features") or [{}])[0]
        summary = ((feature.get("properties") or {}).get("summary") or {})
        geometry = feature.get("geometry")

        if not geometry:
            raise MapsNoResultsError("Nie udało się wyznaczyć trasy dla wskazanych punktów.")

        result = {
            "distance_m": summary.get("distance"),
            "duration_s": summary.get("duration"),
            "geometry": geometry,
        }
        cache.set(cache_key, result, timeout=settings.MAPS_ROUTE_CACHE_TIMEOUT)
        return result

    @staticmethod
    def _raise_for_status(response: requests.Response) -> None:
        try:
            response.raise_for_status()
        except requests.HTTPError as exc:
            detail = ""
            try:
                payload = response.json()
                error = payload.get("error")
                detail = error.get("message") if isinstance(error, dict) else str(payload)
            except ValueError:
                detail = response.text[:300]

            raise MapsServiceError(detail or "Map provider request failed.") from exc
