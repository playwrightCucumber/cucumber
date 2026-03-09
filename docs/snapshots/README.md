# Accessibility Tree Snapshots

Snapshot YAML dari accessibility tree halaman web Chronicle, diambil via `playwright-cli` (MCP Playwright).

## Cara Pakai

- Gunakan file ini sebagai **referensi selector** saat menulis/debug test
- Tidak perlu buka browser — cukup baca YAML untuk tahu struktur DOM
- Cocokkan `ref=`, `role`, `data-testid`, dan `text` dengan selector di `src/selectors/`

## Cara Capture Snapshot Baru

```bash
# Via MCP Playwright
1. playwright-cli navigate ke halaman target
2. playwright-cli snapshot → simpan output ke .yml
3. Taruh di folder feature yang sesuai (roi/, sales/, dll)
```

## Struktur Folder

```
snapshots/
├── roi/
│   ├── plots-tab.yml          # Halaman Tables, tab PLOTS (default view)
│   ├── filtered-plots.yml     # Tab PLOTS setelah filter Status: Vacant
│   ├── add-roi-form.yml       # Form Add ROI (kosong)
│   └── plot-search-result.yml # Form Add ROI setelah search plot "B G 9"
└── (feature lain bisa ditambah di sini)
```

## Tips

- Snapshot bisa *outdated* jika UI berubah — selalu verify ulang jika test gagal
- `[ref=eXXXX]` berubah setiap session, jangan jadikan selector
- Gunakan `data-testid`, `role`, `aria-label`, atau text content sebagai selector yang stabil
