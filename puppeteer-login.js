const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    await page.goto('http://localhost:3000/login');

    // Fill the login form
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@example.com');
    // Wait for it, maybe we need the exact IDs or we just type into the inputs
    const inputs = await page.$$('input');
    // assuming [1] is password
    await inputs[1].type('password123'); // or password

    // click submit
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log("Navigated to:", page.url());

    // Wait to see if there are any errors
    await new Promise(r => setTimeout(r, 2000));

    await browser.close();
})();
