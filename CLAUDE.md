# WIBOR Calculator — Architecture Guide

Polish mortgage WIBOR calculator. Compares loan costs with/without WIBOR for litigation support. Three scenarios: Odwiborowanie (active), Kredyt 0%, Unieważnienie (coming soon).

## Tech Stack
React 19 + TypeScript + Vite + Tailwind CSS + Zustand (state) + Dexie (IndexedDB) + Vitest (tests)

## Project Structure
```
src/
├── core/                # State & persistence
│   ├── CaseContext.ts     # Zustand store + derived selectors (useResult, useWiborSource)
│   ├── types.ts           # Case, StoredLoanInput, WiborDataset
│   ├── serialization.ts   # Date ↔ string conversion for IndexedDB
│   ├── db.ts              # Dexie schema (cases, wiborDatasets)
│   ├── caseStore.ts       # Case CRUD
│   └── wiborStore.ts      # WIBOR dataset CRUD
├── utils/
│   ├── calculations.ts    # Core financial engine (PURE, no side effects)
│   ├── calculations.test.ts # 11 tests for core engine
│   ├── formatters.ts      # PLN formatting, date helpers
│   └── explanations/      # Step-by-step calculation breakdowns
├── modules/               # Feature modules (declarative registration)
│   ├── index.ts             # appModules[] and tabModules[] arrays
│   ├── types.ts             # AppModule (comingSoon, showInHeader), TabModule
│   ├── calculator/          # Odwiborowanie scenario (active)
│   ├── zeroPercent/         # Kredyt 0% scenario (comingSoon)
│   ├── invalidation/        # Unieważnienie scenario (comingSoon)
│   ├── wiborData/           # WIBOR data sheet (alwaysEnabled, showInHeader: false)
│   ├── cases/               # Case management sheet
│   ├── summary/             # Overview metrics tab
│   ├── schedule/            # Amortization table tab
│   ├── breakdown/           # Interest breakdown tab
│   └── comparison/          # WIBOR vs no-WIBOR tab
├── core-ui/               # Domain-specific UI
│   ├── LoanForm.tsx         # Loan input form with bank templates
│   ├── WiborDataManager.tsx # WIBOR data view/import/export
│   ├── wiborDataService.ts  # CSV/JSON parsing, validation
│   └── SettingsPage.tsx     # Module toggle configuration
├── components/ui/         # Reusable atoms (Panel, StatCard, Sheet, ErrorBoundary, Icons)
├── data/                  # Static data
│   ├── wiborRates.ts        # Hardcoded rates + WIBOR_LAST_ACTUAL cutoff
│   ├── loanTemplates.ts     # Bank presets
│   └── defaults.ts          # Default WIBOR entries from wiborRates
└── App.tsx                # Shell: header, hash router, ErrorBoundary, SheetModuleRenderer
```

## Key Patterns

**Module system**: Register in `modules/index.ts`. Interface: `{ id, type, Component, icon, label, description, alwaysEnabled?, showInHeader?, comingSoon? }`. Modules with `comingSoon: true` appear in Settings as disabled, hidden from header and routing.

**Routing**: Hash-based, synced with Zustand `activeTab`. `parseHash()` reads `location.hash`, `setActiveTab()` writes it. Back/forward/refresh work. Sheets (modals) stay in Zustand state, not URLs.

**Data flow**: LoanForm → `updateInput()` → Zustand → `useResult()` (memoized `calculateLoan()`) → tab views.

**WIBOR source**: `wiborDatasetId` in store determines source. Selector `useWiborSource()` returns `'default' | 'custom'`. No redundant state. Badge in CalculatorView opens wiborData sheet.

**WIBOR data**: `WIBOR_LAST_ACTUAL` in `wiborRates.ts` marks cutoff between real data and forecasts. RateTable component marks forecast rows.

**Persistence**: `LoanInput` (Date objects) ↔ `StoredLoanInput` (ISO strings) via `toLoanInput()` / `toStoredInput()`. UI config (`enabledAppModules`) in localStorage.

## Conventions
- Components: PascalCase (.tsx). Utilities: camelCase (.ts).
- UI text: Polish. Code: English.
- State: Zustand actions only, never direct mutation.
- New module: create `modules/<name>/index.tsx`, register in `modules/index.ts`.
- Derived state: use selectors (`useResult`, `useWiborSource`), not redundant store fields.

## Testing
`npm test` or `npx vitest run`. Tests next to source: `*.test.ts`. Core engine (`calculations.ts`) has 11 tests covering schedule length, balance convergence, interest breakdown, WIBOR resets, bridge margin, edge cases.
