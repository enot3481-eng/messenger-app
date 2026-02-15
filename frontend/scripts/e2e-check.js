const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const outDir = path.resolve(__dirname, '..');
  const results = { console: [], actions: [] };

  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    results.console.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', err => {
    results.console.push({ type: 'pageerror', text: String(err) });
  });

  try {
    console.log('Navigating to http://localhost:5173/');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // screenshot
    const screenshotPath = path.join(outDir, 'e2e-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Saved screenshot to', screenshotPath);

    // try to find and click registration or start buttons
    const reg = page.locator('text=Зарегистрироваться');
    if (await reg.count() > 0) {
      await reg.first().click().catch(()=>{});
      results.actions.push('clicked Зарегистрироваться');
    }

    // attempt to fill basic inputs if present
    const email = page.locator('input[type="email"]');
    if (await email.count() > 0) {
      await email.first().fill('test@example.com');
      results.actions.push('filled email');
    }
    const pwd = page.locator('input[type="password"]');
    if (await pwd.count() > 0) {
      await pwd.first().fill('password123');
      results.actions.push('filled password');
    }

    // submit any form if present
    const submit = page.locator('button[type="submit"]');
    if (await submit.count() > 0) {
      await submit.first().click().catch(()=>{});
      results.actions.push('clicked submit');
    }

    // wait a bit to collect console logs
    await page.waitForTimeout(1000);
  } catch (err) {
    console.error('E2E check failed:', err);
    results.console.push({ type: 'error', text: String(err) });
  } finally {
    await browser.close();
    const outJson = path.join(outDir, 'e2e-console.json');
    fs.writeFileSync(outJson, JSON.stringify(results, null, 2));
    console.log('Wrote console results to', outJson);
  }
})();