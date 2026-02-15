import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Test 1: Register new user
    console.log('\n=== Test 1: Registration ===');
    await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'test' + Date.now() + '@example.com');
    await page.fill('input[type="text"]:nth-of-type(1)', 'TestUser');
    await page.fill('input[type="text"]:nth-of-type(2)', '@testuser');
    await page.fill('input[type="password"]:nth-of-type(1)', 'password123');
    await page.fill('input[type="password"]:nth-of-type(2)', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    const regUrl = page.url();
    console.log('After registration, URL:', regUrl);
    console.log('Registration:', regUrl.includes('dashboard') ? 'PASS ✓' : 'FAIL ✗');

    // Test 2: Reload and check if session persists
    console.log('\n=== Test 2: Session Persistence ===');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const afterReloadUrl = page.url();
    console.log('After reload, URL:', afterReloadUrl);
    console.log('Session persisted:', afterReloadUrl.includes('dashboard') ? 'PASS ✓' : 'FAIL ✗');

    // Test 3: Logout and login
    console.log('\n=== Test 3: Login Flow ===');
    await page.goto('http://localhost:5175/login', { waitUntil: 'networkidle' });
    const testEmail = 'test.existing@example.com';
    const testPassword = 'password123';
    
    // First, register a test user
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="text"]:nth-of-type(1)', 'ExistingUser');
    await page.fill('input[type="text"]:nth-of-type(2)', '@existing');
    await page.fill('input[type="password"]:nth-of-type(1)', testPassword);
    await page.fill('input[type="password"]:nth-of-type(2)', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Now clear localStorage (simulate logout)
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:5175/login', { waitUntil: 'networkidle' });
    
    // Try to login
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    const loginUrl = page.url();
    console.log('After login, URL:', loginUrl);
    console.log('Login:', loginUrl.includes('dashboard') ? 'PASS ✓' : 'FAIL ✗');

    console.log('\n=== All Tests Complete ===\n');
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
})();
