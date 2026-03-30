import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 200 });
  const context = await browser.newContext({ 
    viewport: { width: 1280, height: 720 }, 
    ignoreHTTPSErrors: true,
    storageState: 'auth-support-admin.json'
  });
  const page = await context.newPage();

  await page.goto('https://aus.chronicle.rip/chronicle-admin/astana_tegal_gundul_aus', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  // Test the exact selector we're using
  const selector = 'cl-cemetery-action-wrapper:has(span:text-is("More"))';
  const loc = page.locator(selector);
  
  console.log('=== SELECTOR TEST ===');
  console.log(`Selector: ${selector}`);
  console.log(`Count: ${await loc.count()}`);
  
  if (await loc.count() > 0) {
    const first = loc.first();
    console.log(`Visible: ${await first.isVisible()}`);
    console.log(`BoundingBox: ${JSON.stringify(await first.boundingBox())}`);
    console.log(`Enabled: ${await first.isEnabled()}`);
  }

  // Try alternative selectors
  const alts = [
    'span:text("More")',
    'text=More',
    '//span[normalize-space()="More"]',
    'cl-cemetery-action-wrapper >> text=More',
    '.chronicle-action:has(> :text("More"))',
  ];
  
  console.log('\n=== ALTERNATIVE SELECTORS ===');
  for (const alt of alts) {
    try {
      const l = page.locator(alt);
      const count = await l.count();
      const visible = count > 0 ? await l.first().isVisible().catch(() => 'error') : false;
      console.log(`[${count}] visible=${visible} → ${alt}`);
    } catch (e: any) {
      console.log(`[ERR] → ${alt}: ${e.message?.substring(0, 80)}`);
    }
  }

  // Check if cemetery panel is scrolled
  const panelScroll = await page.evaluate(() => {
    const panels = document.querySelectorAll('.scrollable-container, .cemetery-view, cl-cemetery-info-wrapper');
    return [...panels].map(p => ({
      tag: p.tagName,
      class: p.className?.substring(0, 60),
      scrollTop: p.scrollTop,
      scrollHeight: p.scrollHeight,
      clientHeight: p.clientHeight,
    }));
  });
  console.log('\n=== SCROLLABLE PANELS ===');
  console.log(JSON.stringify(panelScroll, null, 2));

  await browser.close();
})();
