const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/test-ui');
  // Wait for the Email Configuration to render
  await page.waitForSelector('.bg-gradient-to-r', { timeout: 10000 });
  
  const artifactDir = 'C:\\Users\\prems\\.gemini\\antigravity-ide\\brain\\046d4027-0f51-41cd-8ea5-c52b1238d9cb';
  
  // Screenshot 1: Initial empty modal
  await page.screenshot({ path: artifactDir + '\\screenshot_1_initial.png', fullPage: true });
  console.log('Took screenshot 1');
  
  // Click Add Policy Breakdown
  await page.click('text="Add Policy Breakdown"');
  await page.waitForTimeout(500);
  
  // Screenshot 2: One row
  await page.screenshot({ path: artifactDir + '\\screenshot_2_one_row.png', fullPage: true });
  console.log('Took screenshot 2');
  
  // Click Add Policy Breakdown again
  await page.click('text="Add Policy Breakdown"');
  await page.waitForTimeout(500);
  
  // Screenshot 3: Two rows
  await page.screenshot({ path: artifactDir + '\\screenshot_3_two_rows.png', fullPage: true });
  console.log('Took screenshot 3');
  
  await browser.close();
})();
