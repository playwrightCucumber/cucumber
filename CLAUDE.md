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

## Wait Strategy — NEVER Use Static Waits

**DILARANG** pakai `page.waitForTimeout()`. Gunakan `NetworkHelper` atau element wait.

### Pilih Wait Berdasarkan Konteks:

| Konteks | Gunakan | Contoh |
|---------|---------|--------|
| Setelah navigasi/click yang pindah halaman | `waitForURL` + `waitForSelector` | `await page.waitForURL('**/add/roi'); await page.waitForSelector(selector);` |
| Tunggu API selesai (tahu endpoint) | `waitForEndpoint` (setup SEBELUM trigger) | `const p = waitForEndpoint(page, 'plots/'); await button.click(); await p;` |
| Tunggu API selesai (tidak tahu endpoint) | `NetworkHelper.waitForApiRequestsComplete()` | `await NetworkHelper.waitForApiRequestsComplete(page, 5000);` |
| Tunggu element muncul | `element.waitFor()` | `await locator.waitFor({ state: 'visible', timeout: 10000 });` |
| Setelah click dropdown/dialog | `waitFor` on overlay | `await page.locator('.cdk-overlay-pane').waitFor({ state: 'visible' });` |
| Tunggu animasi/transisi | `NetworkHelper.waitForAnimation()` | `await NetworkHelper.waitForAnimation(page);` |
| DOM stabil setelah render | `NetworkHelper.waitForStabilization()` | `await NetworkHelper.waitForStabilization(page, { minWait: 300, maxWait: 2000 });` |
| Form siap diisi | `NetworkHelper.waitForFormReady()` | `await NetworkHelper.waitForFormReady(page, 'form');` |

### Aturan Penting:
1. **Jangan duplikat wait** — jika step sebelumnya sudah `waitForSelector(X)`, step berikutnya tidak perlu wait `X` lagi
2. **`waitForEndpoint` HARUS dipasang SEBELUM action** — jika dipasang setelah, response bisa terlewat → timeout penuh
3. **Satu element wait cukup** — jika `mat-select:has-text("A")` sudah visible berarti API selesai + DOM rendered, tidak perlu tambah `waitForApiRequestsComplete` + `waitForStabilization`
4. **Gunakan `{ optional: true }` hati-hati** — jika API tidak terpanggil, wait tetap tunggu sampai timeout penuh

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

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (90-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk vitest run          # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->