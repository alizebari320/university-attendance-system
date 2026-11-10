const { chromium } = require('playwright');
const fs = require('fs');

const OUT = '/tmp/opencode/shots';
fs.mkdirSync(OUT, { recursive: true });

const errors = [];

async function login(page, email, password) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(900);
}

async function shoot(page, name) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`); });
  page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`));

  // Doctor
  await login(page, 'doctor@university.edu', 'Doctor123!');
  await shoot(page, '01-doctor-dashboard');

  for (const [path, name] of [
    ['/colleges', '02-doctor-colleges'],
    ['/departments', '03-doctor-departments'],
    ['/students', '04-doctor-students'],
    ['/lecturers', '05-doctor-lecturers'],
    ['/courses', '06-doctor-courses'],
    ['/lectures', '07-doctor-lectures'],
    ['/reports/weekly', '08-doctor-reports'],
    ['/audit', '09-doctor-audit'],
    ['/fraud', '10-doctor-fraud'],
    ['/notifications', '11-doctor-notifications'],
    ['/settings', '12-doctor-settings'],
  ]) {
    await page.goto(`http://localhost:5173${path}`, { waitUntil: 'domcontentloaded' });
    await shoot(page, name);
  }

  // Logout via settings button
  await page.goto('http://localhost:5173/settings', { waitUntil: 'domcontentloaded' });
  const signOut = page.getByRole('button', { name: /sign out/i });
  if (await signOut.count()) {
    await signOut.click();
    await page.waitForURL('**/login', { timeout: 10000 });
  }
  await context.clearCookies();

  // Student
  await login(page, 'student@university.edu', 'Student123!');
  await shoot(page, '13-student-dashboard');
  for (const [path, name] of [
    ['/attendance', '14-student-attendance'],
    ['/justifications', '15-student-justifications'],
    ['/notifications', '16-student-notifications'],
    ['/courses', '17-student-courses'],
  ]) {
    await page.goto(`http://localhost:5173${path}`, { waitUntil: 'domcontentloaded' });
    await shoot(page, name);
  }
  await context.clearCookies();

  // Lecturer
  await login(page, 'lecturer@university.edu', 'Lecturer123!');
  await shoot(page, '18-lecturer-dashboard');
  await page.goto('http://localhost:5173/lectures', { waitUntil: 'domcontentloaded' });
  await shoot(page, '19-lecturer-lectures');
  await page.goto('http://localhost:5173/attendance', { waitUntil: 'domcontentloaded' });
  await shoot(page, '20-lecturer-attendance');

  // Mobile check (student)
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mpage = await mobile.newPage();
  await login(mpage, 'student@university.edu', 'Student123!');
  await shoot(mpage, '21-student-mobile');

  await browser.close();

  console.log('--- CONSOLE/PAGE ERRORS ---');
  if (errors.length === 0) console.log('none');
  else errors.forEach(e => console.log(e));
})().catch(err => {
  console.error('TEST FAILED:', err.message);
  if (errors.length) errors.forEach(e => console.log(e));
  process.exit(1);
});
