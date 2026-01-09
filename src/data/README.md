# Test Data Management

## 📍 Single Source of Truth

**SEMUA test data harus diatur di `test-data.ts`** - ini adalah satu-satunya tempat untuk konfigurasi test.

## 🎯 Cara Menggunakan

### 1. Import Test Data

```typescript
// Import yang kamu butuhkan
import { TEST_DATA, LOGIN_DATA, BASE_CONFIG } from '../data/test-data.js';

// Contoh penggunaan
await page.goto(BASE_CONFIG.baseUrl);
await loginPage.login(LOGIN_DATA.valid.email, LOGIN_DATA.valid.password);
```

### 2. Override dengan Environment Variables

Buat file `.env` di root project (copy dari `.env.example`):

```bash
# Override hanya yang perlu diubah
TEST_EMAIL=email-baru@example.com
TEST_PASSWORD=password-baru
BASE_URL=https://production.chronicle.rip
```

### 3. Jalankan Test

```bash
# Test akan otomatis pakai nilai dari .env (jika ada)
npm test

# Atau override langsung via command line
TEST_EMAIL=other@email.com npm test
```

## 📂 Struktur Data

```typescript
TEST_DATA = {
  config: {
    baseUrl,    // BASE_URL dari env atau default
    browser,    // Browser type (chromium/firefox/webkit)
    headless,   // true/false untuk headless mode
    timeout     // Default timeout in ms
  },
  login: {
    valid: { email, password, organizationName },
    invalid: { email, password }
  },
  cemetery: "Cemetery Name",
  plot: { section, row, number },
  advanceSearch: { plotId, plotType, status, ... },
  interment: { add: {...}, edit: {...} },
  roi: { basic: {...}, withPerson: {...} }
}
```

## ⚠️ Jangan Pakai Config.ts

`Config.ts` sudah deprecated. Semua config sekarang ada di `test-data.ts`.

## 🔄 Untuk Regression Testing

1. Copy `.env.example` ke `.env`
2. Update semua nilai test data
3. Run test - semua scenario akan pakai data baru

## 💡 Tips

- **Default values** sudah ada di `test-data.ts`
- **Override selective** - hanya set env var yang mau diubah
- **Bulk update** - pakai `.env` file untuk update banyak data sekaligus
- **Jangan commit** file `.env` (sudah ada di .gitignore)
