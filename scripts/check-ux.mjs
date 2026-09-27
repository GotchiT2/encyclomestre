import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const browser = await chromium.launch();
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
await context.addInitScript(() =>
	localStorage.setItem(
		'encyclomestre.auth-session',
		JSON.stringify({
			accessToken: 'mock-only',
			user: { id: '1', username: 'Demo', displayName: 'Demo', money: 10000, role: 'user' }
		})
	)
);
const page = await context.newPage();
page.on('pageerror', (e) => errors.push(e.message));
try {
	await page.goto('https://127.0.0.1:5180/market');
	await page.locator('[data-auction-id]').first().waitFor();
	await page.getByText('Les enchères sont maintenant disponibles.').waitFor();
	for (const width of [360, 390, 768, 1024, 1440]) {
		await page.setViewportSize({ width, height: 1000 });
		await page.evaluate(() => scrollTo(0, 500));
		const box = await page.getByText('Les enchères sont maintenant disponibles.').boundingBox();
		assert.ok(box && box.y >= 0 && box.y < 450, `Sticky banner at ${width}`);
		assert.ok(
			await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
			`No overflow at ${width}`
		);
		await page
			.locator('[data-auction-id]')
			.first()
			.locator('[data-testid="card-tile"] button')
			.click();
		const dialog = page.locator('[data-testid="card-detail-modal"]');
		await dialog.waitFor();
		await dialog.getByRole('heading', { name: 'Variantes référencées', exact: true }).waitFor();
		await dialog
			.getByRole('button', { name: /Variantes:/ })
			.first()
			.click();
		await page.getByRole('searchbox', { name: 'Rechercher une variante' }).fill('');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await page.keyboard.press('Escape');
		if (await dialog.isVisible()) await page.keyboard.press('Escape');
		await dialog.waitFor({ state: 'hidden' });
		await page.screenshot({ path: join(tmpdir(), `wikiforge-ux-${width}.png`), fullPage: false });
	}
	await page.getByRole('button', { name: 'Fermer cette annonce' }).click();
	await page.goto('https://127.0.0.1:5180/guild');
	await page.getByRole('heading', { name: 'Guildes', exact: true }).waitFor();
	assert.equal(await page.getByText('Les enchères sont maintenant disponibles.').count(), 0);
	await page.reload();
	await page.waitForTimeout(300);
	assert.equal(await page.getByText('Les enchères sont maintenant disponibles.').count(), 0);
	await page.goto('https://127.0.0.1:5180/notifications');
	await page.evaluate(() => sessionStorage.setItem('wikiforge-ux-scenario', 'notification-error'));
	await page.getByText('Vous avez été surenchéri').first().click();
	await page.waitForURL(/market\/70/);
	await page.getByLabel('Votre maximum', { exact: true }).waitFor();
	assert.deepEqual(errors, []);
	assert.deepEqual(remote, []);
	console.log(
		'UX: sticky banners, dismissal, variants, card modals, keyboard and notification failure validated at five widths.'
	);
} finally {
	await browser.close();
}
