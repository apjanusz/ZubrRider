ZubrRider to aplikacja carpoolingowa z backendem `Django REST Framework + SimpleJWT` i frontendem `React + Vite`.

Najważniejsze endpointy auth:

- `POST /api/accounts/register/`
- `POST /api/accounts/token/`
- `POST /api/accounts/token/refresh/`

Integracja map:

- backend korzysta z `openrouteservice`
- wymagany jest `ORS_API_KEY` w `backend/.env`
- geokodowanie: `GET /api/maps/geocode/?query=...&size=5`
- wyznaczanie trasy: `POST /api/maps/route/`

Przykład `POST /api/maps/route/`:

```json
{
  "start": { "latitude": 53.1325, "longitude": 23.1688 },
  "end": { "latitude": 53.0167, "longitude": 22.95 }
}
```

Opcjonalne ustawienia cache w `backend/.env`:

- `MAPS_GEOCODE_CACHE_TIMEOUT=86400`
- `MAPS_ROUTE_CACHE_TIMEOUT=3600`

Uruchomienie lokalne:

1. Uzupełnij `backend/.env`, w tym `ORS_API_KEY`.
2. Uruchom backend przez `backend/zrvenv/bin/python backend/manage.py runserver`.
3. Uruchom frontend w `frontend/` przez `npm run dev`.
