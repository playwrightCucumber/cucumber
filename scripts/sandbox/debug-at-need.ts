// Debug script - navigate through AT-NEED form to Event Service section
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://map.chronicle.rip/astana_tegal_gundul_aus/plots/B%20A%201/purchase/At-need/85');
  await page.waitForTimeout(5000);
  
  // ROI section
  const rightType = page.getByRole('combobox', { name: 'Right Type' });
  await rightType.click();
  await page.getByRole('option', { name: 'Burial' }).click();
  const term = page.getByRole('combobox', { name: 'Term of Right' });
  await term.click();
  await page.getByRole('option', { name: 'Perpetual' }).click();
  await page.locator('button:has-text("continue")').click();
  await page.waitForTimeout(1000);
  
  // ROI Applicant
  const appSection = page.locator('mat-expansion-panel').filter({ has: page.locator('mat-panel-title:has-text("ROI Applicant")') });
  await appSection.locator('input').first().waitFor({ state: 'visible' });
  const appInputs = appSection.locator('mat-form-field input');
  await appInputs.nth(0).fill('Test');
  await appInputs.nth(1).fill('Buyer');
  // Find email field (might be nth(2) or later)
  const emailField = appSection.locator('mat-form-field:has-text("Email") input').first();
  await emailField.fill('test@example.com');
  // Click CONTINUE specifically inside ROI Applicant section
  await appSection.locator('button:has-text("continue")').click();
  await page.waitForTimeout(2000);
  
  // ROI Holder 
  console.log('Looking for ROI Holder section...');
  const holderPanel = page.locator('mat-expansion-panel').filter({ has: page.locator('mat-panel-title:has-text("ROI Holder")') });
  const holderVisible = await holderPanel.locator('input').first().waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
  console.log('ROI Holder inputs visible:', holderVisible);
  if (holderVisible) {
    await holderPanel.locator('mat-form-field input').nth(0).fill('Test');
    await holderPanel.locator('mat-form-field input').nth(1).fill('Holder');
    await holderPanel.locator('button:has-text("continue")').click();
    await page.waitForTimeout(1000);
  } else {
    console.log('ROI Holder skipped - checking expanded sections...');
    const panels = page.locator('mat-expansion-panel');
    const pcount = await panels.count();
    for (let i = 0; i < pcount; i++) {
      const title = await panels.nth(i).locator('mat-panel-title').textContent().catch(() => 'unknown');
      const expanded = await panels.nth(i).getAttribute('class').then(c => c?.includes('mat-expanded') || false).catch(() => false);
      console.log(`  Panel ${i}: "${title?.trim()}" expanded=${expanded}`);
    }
  }
  
  // Deceased
  console.log('Looking for Deceased section...');
  const deceasedPanel = page.locator('mat-expansion-panel').filter({ has: page.locator('mat-panel-title:has-text("Deceased")') });
  const deceasedVisible = await deceasedPanel.locator('input').first().waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
  console.log('Deceased inputs visible:', deceasedVisible);
  if (deceasedVisible) {
    await deceasedPanel.locator('mat-form-field input').nth(0).fill('John');
    await deceasedPanel.locator('mat-form-field input').nth(1).fill('Doe');
    
    // Check how many required fields in Deceased
    const deceasedFields = deceasedPanel.locator('mat-form-field');
    const dfCount = await deceasedFields.count();
    console.log('Deceased form fields count:', dfCount);
    for (let i = 0; i < dfCount; i++) {
      const label = await deceasedFields.nth(i).locator('mat-label, label').textContent().catch(() => 'no label');
      const required = await deceasedFields.nth(i).innerHTML().then(h => h.includes('*')).catch(() => false);
      console.log(`  Deceased field ${i}: "${label?.trim()}", required=${required}`);
    }
    
    // Check continue button state
    const continueBtn = deceasedPanel.locator('button:has-text("continue")');
    const btnDisabled = await continueBtn.isDisabled().catch(() => 'unknown');
    console.log('Deceased continue button disabled:', btnDisabled);
    
    await continueBtn.click();
    await page.waitForTimeout(2000);
    
    // Check if Event Service opened after clicking continue
    const eventPanel = page.locator('mat-expansion-panel').filter({ has: page.locator('mat-panel-title:has-text("Event Service")') });
    const eventExpanded = await eventPanel.getAttribute('class').then(c => c?.includes('mat-expanded') || false);
    console.log('Event Service expanded after Deceased continue:', eventExpanded);
  } else {
    console.log('Deceased section not visible, dumping page state...');
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
    console.log('Body text:', bodyText);
  }
  
  // Now we should be at Event Service section - capture DOM
  const eventSection = page.locator('mat-expansion-panel').filter({ has: page.locator('mat-panel-title:has-text("Event Service")') });
  const isVisible = await eventSection.isVisible();
  console.log('Event Service section visible:', isVisible);
  
  // Check expanded state
  const isExpanded = await eventSection.getAttribute('class').then(c => c?.includes('mat-expanded') || false);
  console.log('Event Service expanded:', isExpanded);
  
  // Try clicking to expand
  if (!isExpanded) {
    console.log('Trying to click Event Service header to expand...');
    const header = eventSection.locator('mat-expansion-panel-header');
    const isDisabled = await header.getAttribute('aria-disabled');
    console.log('Event Service header aria-disabled:', isDisabled);
    
    // Check which panels are expanded now
    const panels = page.locator('mat-expansion-panel');
    const pcount = await panels.count();
    for (let i = 0; i < pcount; i++) {
      const title = await panels.nth(i).locator('mat-panel-title').textContent().catch(() => 'unknown');
      const expanded = await panels.nth(i).getAttribute('class').then(c => c?.includes('mat-expanded') || false);
      console.log(`  Panel ${i}: "${title?.trim()}" expanded=${expanded}`);
    }
    
    // Try clicking the header
    try {
      await header.click({ force: true });
      await page.waitForTimeout(2000);
      const afterExpand = await eventSection.getAttribute('class').then(c => c?.includes('mat-expanded') || false);
      console.log('After click, Event Service expanded:', afterExpand);
      
      const formFields = eventSection.locator('mat-form-field');
      const count = await formFields.count();
      console.log('Form fields after expand:', count);
      
      for (let i = 0; i < count; i++) {
        const label = await formFields.nth(i).locator('mat-label, label').textContent().catch(() => 'no label');  
        const input = formFields.nth(i).locator('input, textarea');
        const dataTestId = await input.getAttribute('data-testid').catch(() => 'no data-testid');
        const placeholder = await input.getAttribute('placeholder').catch(() => 'no placeholder');
        console.log(`  Field ${i}: label="${label}", data-testid="${dataTestId}", placeholder="${placeholder}"`);
      }
    } catch (e) {
      console.log('Could not click Event Service header:', e);
    }
  }
  
  await browser.close();
})();
