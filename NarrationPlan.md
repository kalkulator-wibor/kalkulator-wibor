# Ton narracji — dlaczego taki, kiedy zmienić

## Obecny ton: narzędzie analityczne

Serwis celowo mówi językiem **scenariusza hipotetycznego**, nie roszczenia.
Nie twierdzi, że bank popełnił błąd. Nie obiecuje wygranej. Nie świadczy usług prawnych.

### Dlaczego

Bez zaplecza kancelarii prawnej agresywna narracja naraża właściciela serwisu na:

| Ryzyko | Podstawa |
|--------|----------|
| Pozew banku o naruszenie dóbr osobistych | Art. 23–24 KC — twierdzenie, że bank „pobrał za dużo" jest oceną prawną, nie faktem |
| Zarzut świadczenia usług prawnych bez uprawnień | Ustawa o radcach prawnych / o adwokaturze — „prowadzenie sprawy", „redakcja pism procesowych" |
| Zarzut nieuczciwej praktyki rynkowej | Art. 5 ustawy o przeciwdziałaniu nieuczciwym praktykom — „predykcja szans na wygraną" |
| Odpowiedzialność za błędną poradę | Brak OC zawodowego — użytkownik działa na podstawie „porad" serwisu i przegrywa |

### Co chroni obecny ton

- Słowo „scenariusz" zamiast „nadpłata" — pokazujemy różnicę, nie przesądzamy
- „Sądy mogą badać" zamiast „TSUE potwierdził" — referujemy orzeczenie, nie interpretujemy
- „Uporządkuj dokumenty do rozmowy z prawnikiem" — kierujemy do profesjonalisty
- Disclaimer w stopce: „nie świadczy usług prawnych"

## Kiedy zmienić ton

Gdy serwis będzie działał **pod tarczą kancelarii** (radca prawny / adwokat z OC), narracja może się zmienić:

| Obecny ton (bez kancelarii) | Ton z kancelarią | Uwagi |
|----------------------------|------------------|-------|
| Sprawdź jak wyglądałby Twój kredyt bez WIBOR | Oblicz ile przepłacasz na kredycie z WIBOR | Kancelaria bierze odpowiedzialność za ocenę |
| Różnica w odsetkach | Nadpłacone odsetki | Twierdzenie o nadpłacie wymaga autorytetu prawnego |
| Scenariusz: kredyt bez WIBOR | Twoje roszczenie wobec banku | Roszczenie = ocena prawna = wymaga radcy |
| Sądy mogą badać klauzule WIBOR | Klauzule WIBOR są abuzywne w Twojej umowie | Tylko prawnik może to stwierdzić indywidualnie |
| Uporządkuj dokumenty do rozmowy z prawnikiem | Przygotuj pozew z naszym wsparciem | Kancelaria odpowiada za treść pism |
| Śledź przebieg sprawy krok po kroku | Prowadzimy Twoją sprawę od A do Z | Usługa prawna z pełną odpowiedzialnością |
| Analiza kredytu (header) | Odzyskaj swoje pieniądze | Marketing usługi prawnej, nie narzędzia |
| Pomaga zrozumieć zapisy umowy | Analiza umowy z oceną szans na wygraną | Opinia prawna objęta tajemnicą i OC |

## Co jest potrzebne do zmiany tonu

1. Umowa z kancelarią (radca prawny lub adwokat)
2. OC zawodowe pokrywające porady online
3. Regulamin serwisu ze wskazaniem podmiotu świadczącego pomoc prawną
4. Klauzula informacyjna RODO dla danych przetwarzanych w ramach obsługi prawnej
5. Aktualizacja disclaimerów w stopce i na landing page

## Pliki do aktualizacji przy zmianie tonu

- `src/modules/calculator/CalculatorView.tsx` — hero, TSUE, siatka modułów
- `src/App.tsx` — header tagline, footer disclaimer
- `src/modules/summary/SummaryView.tsx` — nagłówki sekcji wyników
- `src/modules/cases/CasesPanel.tsx` — opisy WPS
- `src/utils/explanations/summaryExplanations.ts` — etykiety w objaśnieniach
- `dane/loanTemplates.json` (repo zewnętrzne) — `lawsuitBasis.notes` per szablon
