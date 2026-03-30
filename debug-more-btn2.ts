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

  // Deep search for "More" element
  const moreInfo = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const results: any[] = [];
    for (const el of all) {
      // Only check direct text children (not nested)
      const directText = [...el.childNodes]
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent?.trim())
        .filter(t => t && t.length > 0)
        .join('');
      
      if (directText === 'More' || el.textContent?.trim() === 'More') {
        results.push({
          tag: el.tagName,
          class: el.className?.substring(0, 100),
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label'),
          dataTestId: el.getAttribute('data-testid'),
          matIcon: el.querySelector('mat-icon')?.textContent || '',
          outerHTML: el.outerHTML.substring(0, 300),
          parentTag: el.parentElement?.tagName,
          parentClass: el.parentElement?.className?.substring(0, 100),
          clickable: el.onclick !== null || el.getAttribute('ng-click') !== null || el.getAttribute('(click)') !== null,
        });
      }
    }
    return results;
  });

  console.log('=== "More" ELEMENTS ===');
  moreInfo.forEach((m, i) => {
    console.log(`[${i}] tag=${m.tag} role=${m.role} dataTestId=${m.dataTestId} clickable=${m.clickable}`);
    console.log(`    class=${m.class}`);
    console.log(`    outerHTML=${m.outerHTML}`);
    console.log('');
  });

  // Also find the container with Event + More
  const containerInfo = await page.evaluate(() => {
    const eventEl = [...document.querySelectorAll('*')].find(e => {
      const directText = [...e.childNodes]
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent?.trim())
        .join('');
      return directText === 'Event';
    });
    
    if (!eventEl) return { error: 'Event not found' };
    
    const container = eventEl.parentElement?.parentElement;
    if (!container) return { error: 'no container' };
    
    return {
      containerTag: container.tagName,
      containerClass: container.className?.substring(0, 100),
      containerDataTestId: container.getAttribute('data-testid'),
      containerHTML: container.outerHTML.substring(0, 800),
    };
  });

  console.log('=== EVENT + MORE CONTAINER ===');
  console.log(JSON.stringify(containerInfo, null, 2));

  await browser.close();
})();
