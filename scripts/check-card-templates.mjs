import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch();
try {
	for (const scenario of ['published', 'missing']) {
		const context = await browser.newContext({
			ignoreHTTPSErrors: true,
			viewport: { width: 1440, height: 1000 },
			reducedMotion: 'reduce'
		});
		const errors = [],
			remote = [];
		await context.route('https://api.wikiforge.fr/**', (r) => {
			remote.push(r.request().url());
			return r.abort();
		});
		await context.addInitScript((value) => {
			sessionStorage.setItem('wikiforge-template-scenario', value);
			localStorage.setItem(
				'encyclomestre.auth-session',
				JSON.stringify({
					accessToken: 'mock-only',
					user: { id: '1', username: 'Demo', displayName: 'Demo', money: 10000, role: 'user' }
				})
			);
		}, scenario);
		const page = await context.newPage();
		page.on('pageerror', (e) => errors.push(e.message));
		await page.goto('https://127.0.0.1:5180/cards');
		if (scenario === 'published') {
			await page.locator('[data-testid="template-card"]').first().waitFor();
			for (const width of [360, 390, 768, 1024, 1440]) {
				await page.setViewportSize({ width, height: 1000 });
				assert.ok(
					await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
				);
				assert.equal(
					await page.locator('[data-testid="template-card"]').first().getAttribute('data-theme'),
					'cyberpunk'
				);
			}
		} else
			await page
				.getByText('Modèle indisponible : affichage standard.', { exact: true })
				.first()
				.waitFor();
		assert.deepEqual(errors, []);
		assert.deepEqual(remote, []);
		await context.close();
	}
	console.log('Published templates and missing-template fallback passed at five widths');
} finally {
	await browser.close();
}
