import { chromium } from 'playwright';
import lighthouse from 'lighthouse';

export async function runLighthouse(url: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    const result = await lighthouse(url, {
      port: new URL(browser.wsEndpoint()).port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });

    const scores = {
      performance: result?.lhr.categories.performance?.score ?? 0,
      accessibility: result?.lhr.categories.accessibility?.score ?? 0,
      bestPractices: result?.lhr.categories['best-practices']?.score ?? 0,
      seo: result?.lhr.categories.seo?.score ?? 0,
    };

    return { scores, report: result?.lhr };
  } finally {
    await browser.close();
  }
}
