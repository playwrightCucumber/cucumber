# CLAUDE.md

Always address the user as "Mr Deden" at the beginning of every sentence or answer.

## Context

**Chronicle** is a cemetery management system. This repo is its BDD test suite (Cucumber + Playwright + TypeScript).

## Commands

```bash
# Run by tag
npm run test:headless -- --tags "@login"

# Run single feature
cross-env NODE_OPTIONS='--loader ts-node/esm' cucumber-js 'src/features/p0/file.feature' --import 'src/**/*.ts'

# Different environment + region
ENVIRONMENT=map REGION=us npm test -- --tags "@p0"
```

See `package.json` scripts for all test commands (`test:staging`, `test:p0`, etc.).

## Critical Rules

- **Public vs Authenticated files MUST be separate** — `{feature}.public.feature` and `{feature}.authenticated.feature`. Never mix in one file.
- **Tag `@public` or `@authenticated` is MANDATORY** at Feature level alongside priority (`@p0`) and feature name (`@login`)
- **Never hardcode URLs** — use helpers from `test-data.ts`: `getCemeteryUrl()`, `getCustomerOrgBaseUrl()`, `getCustomerOrgUrl(path)`
- **URL pattern**: public = `https://{env}.chronicle.rip/{cemetery}_{region}/...`, authenticated = `https://{env}-{region}.chronicle.rip/...`
- **Don't mix data approaches in one feature** — use either all Placeholders (`<TEST_*>`) or all Scenario Outline, not both

## Chronicle-Specific Gotchas

- Chronicle polls the server continuously — always use `NetworkHelper.waitForNetworkIdle()` after navigation, never rely on raw `networkidle`
- Some input fields start as read-only — click the field before filling
- Use `TimeoutHelper` (`clickWithRetry`, `fillWithRetry`) for all interactions, not raw Playwright waits
- Video files are auto-renamed by the `After()` hook — do not rename manually
- `<TEST_*>` placeholders resolve at runtime from `.env` / `test-data.ts`; `Scenario Outline` + `Examples` for per-run variations

## Adding New Tests

1. Selectors in `src/selectors/p0/<feature>/<feature>.selectors.ts`
2. Page object in `src/pages/p0/<Feature>Page.ts` extending `BasePage`
3. Steps in `src/steps/p0/<feature>.steps.ts`
4. Feature in `src/features/p0/<feature>.{public|authenticated}.feature` with required tags

## Debug Snapshots

Accessibility tree snapshots disimpan di `docs/snapshots/<feature>/` sebagai referensi selector & debugging.

### Cara Capture
```bash
# 1. Buka browser & navigasi ke halaman target
playwright-cli open https://staging-aus.chronicle.rip

# 2. Ambil snapshot → simpan ke .yml
playwright-cli snapshot

# 3. Simpan output ke docs/snapshots/<feature>/<nama>.yml
```

### Aturan
- **Simpan snapshot setiap debug flow baru** — taruh di `docs/snapshots/<feature>/`
- **Jika file sudah ada, replace** dengan yang terbaru jika UI berubah
- **Jika ada state baru** (misal: form setelah diisi), tambahkan file baru
- Gunakan YAML snapshot untuk cari selector **tanpa perlu buka browser ulang**
- `ref=eXXXX` berubah setiap session — jangan jadikan selector, gunakan `data-testid`, `role`, `aria-label`, atau text

### Snapshot yang Tersedia
```
docs/snapshots/
├── README.md
└── roi/
    ├── plots-tab.yml          # Tables > tab PLOTS (default)
    ├── filtered-plots.yml     # Tab PLOTS filter Status: Vacant
    ├── add-roi-form.yml       # Form Add ROI (kosong)
    └── plot-search-result.yml # Form Add ROI setelah search plot
```

## Environment

`.env` files: `.env` (active), `.env.chronicle` (staging), `.env.chronicle.prod` (prod), `.env.dev`, `.env.map`. Never commit `.env`.
