# Kalkulator WIBOR

Kalkulator kredytu hipotecznego porównujący spłaty z WIBOR i bez WIBOR. Narzędzie wspomagające analizę roszczeń kredytobiorców.

## Scenariusze

- **Odwiborowanie** — usunięcie WIBOR, kredyt oparty o samą marżę (aktywny)
- **Kredyt 0%** — usunięcie WIBOR i marży, spłata wyłącznie kapitału (wkrótce)
- **Unieważnienie** — unieważnienie umowy, wzajemny zwrot świadczeń (wkrótce)

## Uruchomienie

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # testy (vitest)
npm run build     # build produkcyjny → dist/
```

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · Zustand · Dexie (IndexedDB) · Vitest

## Dane WIBOR

Aplikacja zawiera wbudowane przybliżone stawki WIBOR 3M (2015–2026). Dane od 2025-01 to prognozy. Dokładne dane można zaimportować z pliku CSV (format stooq.pl) lub JSON.

## Architektura

Patrz [CLAUDE.md](./CLAUDE.md) — pełny opis struktury, wzorców i konwencji.
