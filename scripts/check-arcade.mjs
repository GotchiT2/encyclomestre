import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const base = process.env.ARCADE_TEST_BASE ?? 'https://dev.wikiforge.fr';
const widths = (process.env.ARCADE_TEST_WIDTHS ?? '360,390,768,1024,1440').split(',').map(Number);
const browser = await chromium.launch();
const output = join(tmpdir(), 'encyclomestre-arcade');
await mkdir(output, { recursive: true });
const routes = [
	'/collection',
	'/cards',
	'/cards/1',
	'/boosters',
	'/packs/1',
	'/wishlists',
	'/market',
	'/market/70',
	'/trades',
	'/friends',
	'/messages',
	'/guild',
	'/guilds/1?tab=chat',
	'/guilds/1?tab=members',
	'/profile',
	'/users/2',
	'/settings',
	'/achievements',
	'/leaderboard',
	'/notifications',
	'/moderation',
	'/moderation/1'
];
try {
	for (const width of widths) {
		const context = await browser.newContext({
			viewport: { width, height: 950 },
			hasTouch: width <= 768,
			reducedMotion: 'reduce',
			ignoreHTTPSErrors: true
		});
		await context.route('https://api.wikiforge.fr/**', (route) => {
			throw new Error('Live API forbidden: ' + route.request().url());
		});
		await context.addInitScript(() => {
			localStorage.setItem(
				'encyclomestre.auth-session',
				JSON.stringify({
					accessToken: 'mock',
					user: { id: '1', username: 'Demo', displayName: 'Demo', role: 'user', money: 10000 }
				})
			);
			window.__arcadeRequests = [];
			addEventListener('wikiforge:mock-request', (event) =>
				window.__arcadeRequests.push(event.detail)
			);
		});
		const page = await context.newPage();
		page.setDefaultTimeout(20000);
		const errors = [];
		page.on('pageerror', (error) => errors.push(error.message));
		for (const route of routes) {
			console.log('Arcade ' + width + ' ' + route);
			await page.goto(base + route, { waitUntil: 'domcontentloaded' });
			await page.locator('h1').first().waitFor();
			await page.waitForTimeout(160);
			assert.ok(
				await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
				'Overflow ' + width + ' ' + route
			);
		}
		await page.goto(base + '/');
		await page.waitForURL('**/collection');
		await page.locator('[data-testid=card-tile]').first().waitFor();
		if (width < 768)
			assert.equal(
				await page
					.locator('.arcade-card-grid')
					.first()
					.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length),
				2
			);
		await page.screenshot({ path: join(output, 'collection-' + width + '.png') });
		await page.getByRole('button', { name: 'Variantes', exact: true }).click();
		let selector = page.getByRole('dialog');
		await selector.getByRole('button', { name: 'Chrome', exact: true }).waitFor();
		await selector.getByRole('button', { name: 'Chrome', exact: true }).click();
		await selector.getByRole('button', { name: 'Voir les résultats', exact: true }).click();
		await page.getByRole('button', { name: 'Chrome', exact: true }).waitFor();
		await page.goto(base + '/collection');
		await page.getByRole('button', { name: 'Étiquettes', exact: true }).click();
		selector = page.getByRole('dialog');
		await selector
			.getByTestId('tag-filter-selector')
			.locator('button[aria-pressed]')
			.first()
			.waitFor();
		await page.keyboard.press('Escape');
		await page.getByRole('button', { name: 'Doublons', exact: true }).click();
		await page.waitForURL('**/collection?*');
		await page.getByRole('button', { name: 'Protection', exact: true }).click();
		const filters = page.getByRole('dialog');
		await filters.waitFor();
		await filters.getByRole('button', { name: 'Oui', exact: true }).click();
		await filters.getByRole('button', { name: 'Voir les résultats', exact: true }).click();
		await page.getByRole('button', { name: 'Sélectionner', exact: false }).first().click();
		await page.locator('[data-selection-panel]').waitFor();
		if (width < 768) assert.equal(await page.locator('[data-mobile-tabs]').isVisible(), false);
		await page
			.locator('[data-selection-panel]')
			.getByRole('button', { name: 'Annuler', exact: true })
			.click();
		await page.goto(base + '/collection');
		await page.locator('button.card-inspect').first().click();
		await page.locator('[data-testid=card-detail-modal]').waitFor();
		await page.keyboard.press('Tab');
		assert.ok(
			await page
				.locator('[data-testid=card-detail-modal]')
				.evaluate((node) => node.contains(document.activeElement))
		);
		await page.keyboard.press('Escape');
		await page.goto(base + '/boosters');
		await page.locator('.gallery-pack').first().waitFor();
		await page.screenshot({ path: join(output, 'boosters-' + width + '.png') });
		await page.getByTestId('booster-open-one').click();
		const ceremony = page.getByRole('dialog');
		await ceremony.getByRole('button', { name: 'Tout révéler', exact: true }).waitFor();
		await ceremony.getByRole('button', { name: 'Carte suivante', exact: true }).click();
		assert.ok(
			await page.evaluate(() =>
				Object.keys(sessionStorage).some((key) => key.startsWith('encyclomestre.arcade.opening.'))
			)
		);
		await ceremony.getByRole('button', { name: 'Tout révéler', exact: true }).click();
		await ceremony.getByText('Les cartes sont dans votre collection', { exact: true }).waitFor();
		await page.screenshot({ path: join(output, 'opening-' + width + '.png') });
		await ceremony.getByRole('button', { name: 'Quitter', exact: true }).click();
		assert.deepEqual(errors, [], 'Runtime ' + width);
		await context.close();
		console.log('Validated ' + width + 'px');
	}
	console.log('Screenshots: ' + output);
} finally {
	await browser.close();
}
