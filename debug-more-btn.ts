import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();

  // 1. Login
  await page.goto('https://map.chronicle.rip/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const email = page.locator('#mat-input-0');
  const pass = page.locator('#mat-input-1');
  await email.click();
  await email.fill('support@chronicle.rip');
  await pass.click();
  await pass.fill('f9Fz&d4^^9');

  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForTimeout(3000);

  // 2. Select AUS
  const ausBtn = page.getByRole('button', { name: /aus server/i });
  if (await ausBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await ausBtn.click();
    await page.waitForURL('**/chronicle-admin**', { timeout: 15000 });
  }

  await page.waitForTimeout(5000);

  // 3. Search cemetery
  const search = page.locator('input[placeholder="Search"]').first();
  await search.click();
  await search.fill('Astana tegal gundul');
  await page.waitForTimeout(2000);

  // 4. Click cemetery
  const cemetery = page.locator('p:has-text("Astana Tegal Gundul")').first();
  if (await cemetery.isVisible({ timeout: 5000 }).catch(() => false)) {
    await cemetery.click();
    await page.waitForURL('**/astana_tegal_gundul_aus', { timeout: 15000 });
  }

  await page.waitForTimeout(5000);

  // 5. Capture all buttons with their DOM info
  const buttons = await page.evaluate(() => {
    const allBtns = [...document.querySelectorAll('button, [role="button"]')];
    return allBtns
      .filter(b => b.offsetParent !== null)
      .map((b, i) => ({
        index: i,
        text: b.textContent?.trim().substring(0, 60),
        ariaLabel: b.getAttribute('aria-label') || '',
        mattooltip: b.getAttribute('mattooltip') || '',
        dataTestId: b.getAttribute('data-testid') || '',
        matIcon: b.querySelector('mat-icon')?.textContent?.trim() || '',
        tagName: b.tagName,
        outerHTML: b.outerHTML.substring(0, 200),
      }));
  });

  console.log('=== ALL VISIBLE BUTTONS ===');
  buttons.forEach(b => {
    console.log(`[${b.index}] text="${b.text}" ariaLabel="${b.ariaLabel}" dataTestId="${b.dataTestId}" matIcon="${b.matIcon}"`);
  });

  // 6. Specifically find "More" button (near Event)
  const moreBtn = await page.evaluate(() => {
    const eventText = [...document.querySelectorAll('p, span, mat-label')].find(e => e.textContent?.trim() === 'Event');
    if (!eventText) return 'Event paragraph not found';
    const parent = eventText.closest('div, section');
    if (!parent) return 'No parent found';
    const buttons = parent.querySelectorAll('button');
    return [...buttons].map(b => ({
      text: b.textContent?.trim(),
      ariaLabel: b.getAttribute('aria-label') || '',
      dataTestId: b.getAttribute('data-testid') || '',
      matIcon: b.querySelector('mat-icon')?.textContent || '',
      outerHTML: b.outerHTML.substring(0, 300),
      classList: b.className.substring(0, 100),
    }));
  });

  console.log('\n=== MORE BUTTON AREA (near "Event") ===');
  console.log(JSON.stringify(moreBtn, null, 2));

  // 7. Save auth state for future use
  await context.storageState({ path: 'auth-support-admin.json' });

  await browser.close();
  console.log('\nAuth state saved to auth-support-admin.json');
})();
