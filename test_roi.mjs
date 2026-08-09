import { test, expect } from '@playwright/test';
import { chromium } from '@playwright/test';
import { spawn } from 'child_process';

const run = async () => {
  console.log('Starting next server...');
  const nextServer = spawn('npm', ['run', 'dev', '--', '-p', '3001'], {
    stdio: 'pipe',
    shell: true
  });

  const url = 'http://localhost:3001/test-roi';
  let isReady = false;

  nextServer.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Ready in') || output.includes('compiled client and server')) {
      isReady = true;
    }
  });

  for (let i = 0; i < 60; i++) {
    if (isReady) break;
    await new Promise(r => setTimeout(r, 1000));
  }
  await new Promise(r => setTimeout(r, 5000));

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[ROI-TRACE]')) {
      logs.push(text);
      console.log('PAGE LOG:', text);
    }
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('Selecting Rate Locked...');
  const rateLockedSelect = page.locator('select').filter({ has: page.locator('option[value="Y"]') }).first();
  await rateLockedSelect.selectOption('Y');
  
  await page.waitForTimeout(500);

  console.log('Typing 5 into Locked Interest Rate...');
  const interestInput = page.locator('input[name="interest_rate"]');
  await interestInput.click();
  await interestInput.fill('5');
  
  await page.waitForTimeout(500);

  console.log('Blurring...');
  await page.evaluate(() => {
    document.body.focus();
  });

  await page.waitForTimeout(1000);

  console.log('Fetching displayed value...');
  const value = await interestInput.inputValue();

  console.log('\\n\\n--- TEST COMPLETE ---');
  console.log('Displayed Input Value after blur:', value);
  console.log('All Captured Logs:');
  logs.forEach(l => console.log(l));

  await browser.close();
  nextServer.kill();
  process.exit(0);
};

run().catch(e => {
  console.error(e);
  process.exit(1);
});
