import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: 'auth-support-admin.json',
  });
  const page = await context.newPage();

  await page.goto('https://staging-aus.chronicle.rip/chronicle-admin/astana_tegal_gundul_aus/import-data', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(6000);

  const h6Count = await page.locator('cl-section-item h6').count();
  console.log('Staged files:', h6Count);

  if (h6Count === 0) {
    console.log('No staged files — run a test first.');
    await browser.close();
    return;
  }

  const lastH6 = page.locator('cl-section-item h6').last();
  const name = await lastH6.textContent();
  console.log('Last file:', name?.trim());

  await lastH6.hover();
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('cl-section-item h6'));
    const h6El = all[all.length - 1];
    if (!h6El) return null;
    const si = h6El.closest('cl-section-item');
    if (!si) return null;

    function domPath(el: Element, root: Element): string {
      const parts: string[] = [];
      let cur: Element | null = el;
      while (cur && cur !== root) {
        const siblings = cur.parentElement ? Array.from(cur.parentElement.children) : [];
        const idx = siblings.indexOf(cur);
        parts.unshift(cur.tagName + '[' + idx + ']');
        cur = cur.parentElement;
      }
      return parts.join(' > ');
    }

    const buttons = Array.from(si.querySelectorAll('button')).map(function(b) {
      return {
        text: (b.textContent || '').trim().slice(0, 40),
        testId: b.getAttribute('data-testid'),
        ariaLabel: b.getAttribute('aria-label'),
        display: (window.getComputedStyle(b) as any).display,
        visibility: (window.getComputedStyle(b) as any).visibility,
        opacity: (window.getComputedStyle(b) as any).opacity,
        path: domPath(b as Element, si),
      };
    });

    return {
      h6Path: domPath(h6El, si),
      totalButtons: buttons.length,
      buttons: buttons,
    };
  });

  console.log('\nDOM info after hover:');
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
