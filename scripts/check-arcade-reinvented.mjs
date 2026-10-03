import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const base = process.env.ARCADE_TEST_BASE ?? 'https://dev.wikiforge.fr';
const widths = (process.env.ARCADE_TEST_WIDTHS ?? '360,390,768,1024,1440').split(',').map(Number);
const output = join(tmpdir(), 'encyclomestre-reinvented');
await mkdir(output, { recursive: true });
const portrait = await readFile(
	new URL('../static/images/booster-preview/karina.jpg', import.meta.url)
);
const landscape = await readFile(
	new URL('../static/images/booster-preview/blackpink.png', import.meta.url)
);
const browser = await chromium.launch();
const routes = [
	'/welcome',
	'/collection',
	'/cards',
	'/boosters',
	'/packs/1',
	'/wishlists',
	'/market',
	'/market/70',
	'/trades',
	'/friends',
	'/messages',
	'/guild',
	'/guilds/1',
	'/profile',
	'/users/2',
	'/settings',
	'/achievements',
	'/leaderboard',
	'/notifications',
	'/moderation',
	'/moderation/1',
	'/arcade/validation'
];
async function player(width, motion = 'reduce') {
	const context = await browser.newContext({
		viewport: { width, height: 950 },
		ignoreHTTPSErrors: true,
		hasTouch: width < 1024,
		reducedMotion: motion
	});
	const errors = [],
		live = [];
	await context.route('https://api.wikiforge.fr/**', (route) => {
		live.push(route.request().url());
		return route.abort();
	});
	await context.route('https://upload.wikimedia.org/**', (route) =>
		route.fulfill({
			status: 200,
			contentType: route.request().url().toLowerCase().includes('blackpink')
				? 'image/png'
				: 'image/jpeg',
			body: route.request().url().toLowerCase().includes('blackpink') ? landscape : portrait,
			headers: { 'access-control-allow-origin': '*' }
		})
	);
	await context.addInitScript(() => {
		localStorage.setItem(
			'encyclomestre.auth-session',
			JSON.stringify({ accessToken: 'mock', user: { id: '1', username: 'Demo', role: 'user' } })
		);
		window.__opens = 0;
		addEventListener('wikiforge:mock-request', (event) => {
			if (event.detail.method === 'POST' && /\/boosters\/\d+\/open/.test(event.detail.path))
				window.__opens++;
		});
	});
	const page = await context.newPage();
	page.setDefaultTimeout(20000);
	page.on('pageerror', (error) => errors.push(error.message));
	return { context, page, errors, live };
}
try {
	for (const width of widths) {
		const { context, page, errors, live } = await player(width);
		for (const path of routes) {
			await page.goto(base + path, { waitUntil: 'domcontentloaded' });
			await page.locator('h1').first().waitFor();
			await page.waitForTimeout(160);
			assert.ok(
				await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
				'Overflow ' + width + ' ' + path
			);
			assert.equal(
				await page.locator('[data-testid=notification-trigger]').count(),
				1,
				'Single bell ' + path
			);
			if (path === '/market') {
				const clipped = await page.locator('.auction-tile').evaluateAll((tiles) =>
					tiles.flatMap((tile) => {
						const box = tile.getBoundingClientRect();
						return Array.from(tile.querySelectorAll('button'))
							.filter((button) => {
								const b = button.getBoundingClientRect();
								return b.width > 0 && (b.right > box.right + 1 || b.left < box.left - 1);
							})
							.map((button) => button.getAttribute('aria-label'));
					})
				);
				assert.deepEqual(clipped, [], 'Auction actions stay inside their tiles');
			}
			if (path === '/users/2')
				assert.ok((await page.locator('h1').boundingBox()).width > 150, 'Readable player identity');
			await page.screenshot({
				path: join(output, path.split('?')[0].replaceAll('/', '_') + '-' + width + '.png')
			});
		}
		await page.goto(base + '/collection');
		await page.locator('[data-testid=card-tile]').first().waitFor();
		await page.evaluate(() =>
			sessionStorage.setItem('wikiforge-ux-scenario', 'notification-error')
		);
		await page.getByTestId('notification-trigger').click();
		const notifications = page.getByTestId('notification-popover');
		await notifications.locator('.notification-preview').first().waitFor();
		await page.screenshot({ path: join(output, 'notification-panel-' + width + '.png') });
		await notifications.locator('.notification-preview').first().click();
		await page.waitForURL('**/market/70');
		await page.goto(base + '/collection');
		await page.locator('.card-inspect').first().waitFor();
		assert.equal(await page.locator('.desktop-navigation').isVisible(), width >= 1024);
		assert.equal(await page.locator('[data-mobile-tabs]').isVisible(), width < 1024);
		const columns = await page
			.locator('.arcade-card-grid')
			.first()
			.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length);
		assert.equal(columns, { 360: 2, 390: 2, 768: 4, 1024: 6, 1440: 8 }[width], 'Album density');
		const wide = await page
			.locator('.card-object')
			.evaluateAll((nodes) =>
				nodes.map((node) => node.getBoundingClientRect().width).filter((width) => width > 144.1)
			);
		assert.deepEqual(wide, [], 'Compact cards');
		await page.locator('.card-inspect').first().click();
		const inspection = page.getByTestId('card-detail-modal');
		await inspection.waitFor();
		assert.equal(
			await inspection.getByTestId('article-variants').count(),
			0,
			'Owned copies never list variants'
		);
		await page.keyboard.press('Escape');
		await page.goto(base + '/cards/1');
		await page.getByTestId('article-variants').waitFor();
		assert.ok(
			(await page.getByTestId('article-variants').getByRole('button').count()) > 1,
			'All available variants'
		);
		assert.equal(
			await page.getByTestId('article-variants').getByRole('checkbox').count(),
			0,
			'No comparison'
		);
		await page.goto(base + '/trades?partner=2&offerCards=90');
		const negotiation = page.getByRole('dialog');
		await negotiation.locator('.tray-card').first().waitFor();
		await negotiation.getByRole('tab', { name: /Cartes de/ }).click();
		const selectors = negotiation.getByTestId('trade-editor-card-selector');
		const requestedPanel = selectors.locator(':scope>div').nth(1);
		await requestedPanel.locator('.card-inspect').first().click();
		await page.screenshot({ path: join(output, 'trade-board-' + width + '.png') });
		await negotiation.getByRole('button', { name: 'Vérifier l’offre', exact: true }).click();
		await negotiation.locator('.trade-review').waitFor();
		assert.equal(
			await negotiation.locator('.trade-review [data-testid=card-tile]').count(),
			2,
			'Both selected cards reach review'
		);
		await page.screenshot({ path: join(output, 'trade-review-' + width + '.png') });
		await negotiation.getByRole('button', { name: 'Modifier l’offre', exact: true }).click();
		assert.equal(
			await negotiation.locator('.tray-card').count(),
			2,
			'Review keeps the negotiation'
		);
		await page.keyboard.press('Escape');
		assert.deepEqual(errors, []);
		assert.deepEqual(live, []);
		await context.close();
		console.log('Recomposed pages, navigation, density and inspection: ' + width + 'px');
	}
	for (const fallback of [false, true]) {
		const { context, page, errors, live } = await player(390, 'no-preference');
		if (fallback)
			await context.addInitScript(() => {
				const original = HTMLCanvasElement.prototype.getContext;
				HTMLCanvasElement.prototype.getContext = function (type, ...args) {
					return type.startsWith('webgl') ? null : original.call(this, type, ...args);
				};
			});
		await page.goto(base + '/boosters');
		await page
			.locator('.gallery-pack.selected [data-renderer=' + (fallback ? 'dom' : 'webgl') + ']')
			.waitFor();
		await page.getByTestId('booster-open-one').click();
		const dialog = page.getByRole('dialog');
		await dialog.getByRole('button', { name: 'Passer l’animation', exact: true }).waitFor();
		if (!fallback) {
			const canvas = dialog.locator('[data-renderer=webgl] canvas');
			await canvas.waitFor();
			assert.equal(await page.locator('[data-renderer=webgl]').count(), 1, 'Only one active scene');
			await page.screenshot({ path: join(output, 'ceremony-webgl-390.png') });
			await canvas.evaluate((node) =>
				node.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()
			);
			await dialog.locator('[data-renderer=dom]').waitFor();
		}
		await dialog.getByRole('button', { name: 'Passer l’animation', exact: true }).click();
		await dialog.getByRole('button', { name: 'Carte suivante', exact: true }).click();
		await dialog.getByText('1 / 5 cartes révélées', { exact: true }).waitFor();
		await dialog.getByRole('button', { name: 'Tout révéler', exact: true }).click();
		assert.equal(await dialog.getByTestId('card-tile').count(), 5);
		assert.equal(
			await page.evaluate(() => window.__opens),
			1,
			'Animation and context loss never reopen'
		);
		assert.deepEqual(errors, []);
		assert.deepEqual(live, []);
		await context.close();
		console.log(
			fallback ? 'No-WebGL fallback validated' : 'Real 3D, context loss and skip validated'
		);
	}
	console.log('Visual review artifacts: ' + output);
} finally {
	await browser.close();
}
