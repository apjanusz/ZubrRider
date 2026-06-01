# Dokumentacja testów

## Zakres

W projekcie zostały przygotowane automatyczne testy backendowe dla modułów:

- `accounts`
- `rides`
- `community`

Testy sprawdzają logikę biznesową aplikacji, walidację danych, uprawnienia użytkowników oraz poprawność działania najważniejszych endpointów API.

W tym zakresie **nie zostały dodane osobne automatyczne testy frontendowe**. Część zachowań frontendowych jest pośrednio zabezpieczona przez testy kontraktów API, z których frontend korzysta.

## Lokalizacja testów

Pliki testowe:

- [backend/accounts/tests.py](/home/apjanusz/studia/zespolowy/ZubrRider/backend/accounts/tests.py)
- [backend/rides/tests.py](/home/apjanusz/studia/zespolowy/ZubrRider/backend/rides/tests.py)
- [backend/community/tests.py](/home/apjanusz/studia/zespolowy/ZubrRider/backend/community/tests.py)

## Jak uruchomić testy

Uruchamianie odbywa się z katalogu `backend`.

### Wszystkie testy modułu `accounts`

```bash
cd backend
python3 manage.py test accounts
```

### Wszystkie testy modułu `rides`

```bash
cd backend
python3 manage.py test rides
```

### Wszystkie testy modułu `community`

```bash
cd backend
python3 manage.py test community
```

### Uruchomienie wszystkich powyższych pakietów po kolei

```bash
cd backend
python3 manage.py test accounts rides community
```

## Podział testów

Testy zostały uporządkowane zgodnie z 4 etapami prac.

## Etap 1: tworzenie przejazdu

Cel etapu: sprawdzenie, czy przejazd można utworzyć tylko dla poprawnych danych wejściowych.

### Testy

1. `test_create_ride_geocodes_locations_when_coordinates_are_missing`
   Sprawdza, czy przy braku współrzędnych system pobiera je z usługi geokodowania i poprawnie tworzy przejazd.

2. `test_create_ride_uses_coordinates_from_payload`
   Sprawdza, czy jeśli współrzędne zostały podane ręcznie, są one używane bez dodatkowego geokodowania.

3. `test_create_ride_rejects_car_belonging_to_another_user`
   Sprawdza, czy użytkownik nie może opublikować przejazdu z wykorzystaniem auta należącego do innego użytkownika.

4. `test_create_ride_rejects_available_seats_above_car_capacity`
   Sprawdza, czy liczba oferowanych miejsc nie może być większa niż liczba miejsc w wybranym aucie.

5. `test_create_ride_rejects_departure_time_in_the_past`
   Sprawdza, czy nie da się utworzyć przejazdu z datą i godziną ustawioną w przeszłości.

6. `test_created_ride_is_visible_in_my_rides_with_selected_car`
   Sprawdza, czy po utworzeniu przejazdu pojawia się on w widoku `MyRides` i zachowuje informację o wybranym pojeździe.

## Etap 2: rezerwacje i zarządzanie przejazdem

Cel etapu: sprawdzenie logiki rezerwowania, anulowania oraz usuwania przejazdów.

### Testy

1. `test_user_cannot_book_own_ride`
   Sprawdza, czy kierowca nie może zarezerwować własnego przejazdu.

2. `test_booking_ride_decreases_available_seats`
   Sprawdza, czy po skutecznej rezerwacji liczba dostępnych miejsc zostaje zmniejszona.

3. `test_cancel_booking_increases_available_seats`
   Sprawdza, czy anulowanie rezerwacji zwalnia miejsce i zwiększa liczbę dostępnych miejsc.

4. `test_driver_can_delete_own_ride`
   Sprawdza, czy kierowca może usunąć własny przejazd.

5. `test_user_cannot_delete_someone_elses_ride`
   Sprawdza, czy użytkownik nie może usunąć przejazdu należącego do innego kierowcy.

## Etap 3: oceny i historia przejazdów

Cel etapu: sprawdzenie zasad oceniania kierowców i danych wspierających widoki historii.

### Testy

1. `test_passenger_can_rate_completed_ride_once`
   Sprawdza, czy pasażer może dodać ocenę po zakończonym przejeździe i czy tworzony jest wpis oceny oraz alert.

2. `test_cannot_rate_ride_before_it_finishes`
   Sprawdza, czy nie można ocenić przejazdu przed jego zakończeniem.

3. `test_can_rate_ride_later_the_same_day_after_departure_time`
   Sprawdza, czy przejazd może zostać oceniony jeszcze tego samego dnia, jeśli jego godzina już minęła.

4. `test_only_booked_passenger_can_rate_ride`
   Sprawdza, czy oceniać może tylko pasażer z aktywną rezerwacją.

5. `test_passenger_cannot_rate_same_ride_twice`
   Sprawdza, czy ten sam pasażer nie może dodać drugiej oceny dla tego samego przejazdu.

6. `test_my_rides_marks_completed_unrated_passenger_ride_as_not_rated`
   Sprawdza, czy API `MyRides` zwraca poprawną informację `current_user_has_rated = false` dla zakończonego, ale jeszcze nieocenionego przejazdu.

7. `test_driver_profile_returns_zero_rating_stats_when_driver_has_no_reviews`
   Sprawdza, czy kierowca bez opinii ma poprawnie zwracane statystyki ocen: średnia `0` i liczba ocen `0`.

## Etap 4: historia po usunięciu auta i przypadki brzegowe

Cel etapu: sprawdzenie, czy dane historyczne nie znikają po usunięciu pojazdu oraz czy API poprawnie obsługuje przejazdy bez auta.

### Testy

1. `test_deleting_car_preserves_related_rides`
   Sprawdza, czy usunięcie auta nie usuwa powiązanego przejazdu, a jedynie ustawia relację `car` na `null`.

2. `test_ride_detail_returns_null_car_after_vehicle_is_deleted`
   Sprawdza, czy endpoint szczegółów przejazdu zwraca `car = null` po usunięciu pojazdu.

3. `test_my_rides_keeps_preserved_driver_ride_after_vehicle_is_deleted`
   Sprawdza, czy przejazd nadal pozostaje widoczny w `MyRides` kierowcy po usunięciu auta i czy w odpowiedzi ma `car = null`.

4. `test_driver_card_counts_only_completed_rides_in_current_month`
   Sprawdza, czy karta kierowcy liczy tylko przejazdy już wykonane w bieżącym miesiącu, pomijając przyszłe i anulowane.

5. `test_user_profile_returns_completed_rides_stats`
   Sprawdza, czy statystyki profilu użytkownika liczą tylko faktycznie zakończone przejazdy jako kierowca i pasażer.

## Dodatkowe testy modułu `accounts`

Poza testami przypisanymi do etapów w module `accounts` znajdują się też testy walidacyjne profilu i pojazdów.

### Testy pojazdów

- `test_user_can_add_and_list_own_car`
  Sprawdza dodanie auta oraz jego widoczność na liście pojazdów użytkownika.

- `test_car_validation_rejects_invalid_license_plate`
  Sprawdza walidację formatu tablic rejestracyjnych.

- `test_car_validation_rejects_invalid_brand_model_and_seats`
  Sprawdza walidację marki, modelu i liczby miejsc.

- `test_car_validation_rejects_duplicate_license_plate_after_normalization`
  Sprawdza, czy zduplikowana rejestracja jest odrzucana również po normalizacji formatu.

- `test_user_cannot_delete_someone_elses_car`
  Sprawdza, czy użytkownik nie może usunąć auta należącego do innej osoby.

- `test_driver_profile_returns_cars`
  Sprawdza, czy profil kierowcy zwraca przypisane do niego pojazdy.

### Testy profilu użytkownika

- `test_user_can_update_contact_data_with_valid_values`
  Sprawdza poprawną aktualizację danych kontaktowych.

- `test_user_profile_rejects_invalid_contact_data`
  Sprawdza odrzucanie niepoprawnych danych kontaktowych.

- `test_user_can_update_address_with_valid_values`
  Sprawdza poprawną aktualizację adresu użytkownika.

- `test_user_profile_rejects_invalid_address_data`
  Sprawdza odrzucanie błędnych danych adresowych.

- `test_user_profile_requires_street_and_building_number_together`
  Sprawdza wymóg podania ulicy i numeru budynku jako spójnego kompletu danych.

## Dodatkowa uwaga

W pliku [backend/community/tests.py](/home/apjanusz/studia/zespolowy/ZubrRider/backend/community/tests.py) znajduje się również prosty test:

- `test_placeholder`

Jest to techniczny test pomocniczy, który nie sprawdza logiki biznesowej aplikacji.
