import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const base = process.env.PLAN_TEST_BASE ?? 'https://localhost:5180';
const folder = join(tmpdir(), 'encyclomestre-plan-one');
await mkdir(folder, { recursive: true });
const browser = await chromium.launch();
async function navigate(page, path) {
	await page.evaluate((path) => {
		const a = document.createElement('a');
		a.href = path;
		document.body.append(a);
		a.click();
		a.remove();
	}, path);
	await page.waitForURL((url) => url.pathname === path.split('?')[0]);
}
try {
	for (const width of [360, 390, 768, 1024, 1440]) {
		const context = await browser.newContext({
			ignoreHTTPSErrors: true,
			viewport: { width, height: 950 },
			hasTouch: width <= 768,
			reducedMotion: 'reduce'
		});
		const errors = [],
			live = [];
		await context.route('https://api.wikiforge.fr/**', (route) => {
			live.push(route.request().url());
			return route.abort();
		});
		await context.addInitScript(() => {
			localStorage.setItem(
				'encyclomestre.auth-session',
				JSON.stringify({
					accessToken: 'mock',
					user: { id: '1', username: 'Demo', role: 'user', money: 10000 }
				})
			);
			localStorage.setItem(
				'encyclomestre.arcade.preferences',
				JSON.stringify({ opening: 'express' })
			);
			sessionStorage.setItem('wikiforge-plan-scenario', 'stock-limited');
		});
		const page = await context.newPage();
		page.setDefaultTimeout(15000);
		page.on('pageerror', (error) => errors.push(error.message));
		await page.goto(base + '/boosters?pack=1');
		await page.getByRole('button', { name: 'Ouvrir le lot disponible', exact: true }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
		const summary = page.getByRole('dialog');
		await summary.getByText('2 boosters ouverts · 9 crédits restants', { exact: true }).waitFor();
		assert.equal(await summary.getByTestId('card-tile').count(), 10);
		await summary.getByRole('button', { name: 'Quitter', exact: true }).click();
		assert.ok(await page.getByTestId('booster-open-one').isDisabled());
		assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
		await page.screenshot({ path: join(folder, 'booster-batch-' + width + '.png') });
		await page.evaluate(() => sessionStorage.removeItem('wikiforge-plan-scenario'));
		await navigate(page, '/settings');
		await page.getByRole('button', { name: 'Selectionner un avatar', exact: true }).click();
		const dialog = page.getByRole('dialog');
		await dialog.getByRole('searchbox').fill('2NE1');
		await dialog.getByRole('button', { name: '2NE1', exact: true }).click();
		for (const [label, value] of [
			['Position horizontale', '25'],
			['Position verticale', '70'],
			['Zoom', '2.2']
		]) {
			await dialog.getByRole('slider', { name: label, exact: true }).fill(value);
		}
		await dialog.locator('img').first().waitFor();
		await dialog
			.locator('img')
			.first()
			.evaluate((img) =>
				img.complete
					? Promise.resolve()
					: new Promise((resolve) => {
							img.addEventListener('load', resolve, { once: true });
							img.addEventListener('error', resolve, { once: true });
						})
			);
		await page.screenshot({ path: join(folder, 'avatar-crop-' + width + '.png') });
		await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();
		await dialog.waitFor({ state: 'hidden' });
		assert.deepEqual(
			await page.evaluate(
				() => JSON.parse(localStorage.getItem('encyclomestre.auth-session')).user.imageCrop
			),
			{ x: 25, y: 70, zoom: 2.2 }
		);
		await navigate(page, '/profile');
		await page.locator('img[style*="scale(2.2)"]').first().waitFor();
		await navigate(page, '/settings');
		await page.evaluate(() => sessionStorage.setItem('wikiforge-plan-scenario', 'guild-owner'));
		await page.getByRole('button', { name: 'Voir les conséquences', exact: true }).click();
		await page
			.getByRole('alert')
			.filter({ hasText: /Transmettez/ })
			.waitFor();
		assert.equal(
			await page.getByRole('button', { name: 'Supprimer mon compte', exact: true }).count(),
			0
		);
		assert.deepEqual(errors, []);
		assert.deepEqual(live, []);
		console.log(
			'Plan progression ' +
				width +
				': stock-limited batch, avatar crop, guild owner closure block passed'
		);
		await context.close();
	}
} finally {
	await browser.close();
}
