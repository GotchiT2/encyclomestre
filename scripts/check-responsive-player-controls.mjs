import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const base = process.env.PLAN_TEST_BASE ?? 'https://dev.wikiforge.fr';
const output = join(tmpdir(), 'wikiforge-player-controls');
await mkdir(output, { recursive: true });
const image = await readFile(
	new URL('../static/images/booster-preview/karina.jpg', import.meta.url)
);
const browser = await chromium.launch();
try {
	for (const width of [360, 390, 768, 1024, 1440, 1920]) {
		const context = await browser.newContext({
			viewport: { width, height: 1000 },
			ignoreHTTPSErrors: true
		});
		const errors = [],
			live = [];
		await context.route('https://api.wikiforge.fr/**', (route) => {
			live.push(route.request().url());
			return route.abort();
		});
		await context.route('https://upload.wikimedia.org/**', (route) =>
			route.fulfill({ status: 200, contentType: 'image/jpeg', body: image })
		);
		await context.addInitScript(() =>
			localStorage.setItem(
				'encyclomestre.auth-session',
				JSON.stringify({ accessToken: 'mock', user: { id: '1', username: 'Demo', role: 'user' } })
			)
		);
		const page = await context.newPage();
		page.on('pageerror', (e) => errors.push(e.message));
		for (const route of ['/collection', '/cards', '/achievements', '/friends', '/market']) {
			await page.goto(base + route);
			if (route === '/collection' || route === '/cards')
				await page.getByTestId('card-tile').first().waitFor();
			if (route === '/collection') {
				await page.getByTestId('direct-filters').waitFor();
				const line = page.locator('.filter-line');
				assert.ok(
					await line.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
					'filters wrap without horizontal scrollbar'
				);
				await page.getByTestId('tag-filter-selector').getByRole('button').first().focus();
				await page.keyboard.press('Enter');
				await page.getByPlaceholder('Rechercher une étiquette').waitFor();
				await page.keyboard.press('Escape');
			} else if (route === '/cards') {
				const input = page.locator('#codex-search'),
					sort = page.locator('.catalogue-sort summary');
				await input.waitFor();
				const searchBox = await input.boundingBox(),
					sortBox = await sort.boundingBox(),
					parent = await page.locator('.catalogue-search').boundingBox();
				assert.ok(Math.abs(searchBox.y - sortBox.y) < 2, 'search and sort share a row');
				assert.ok(
					Math.abs(sortBox.x + sortBox.width - parent.x - parent.width) < 2,
					'search row spans parent width'
				);
				await sort.click();
				const panel = page.locator('.sort-content');
				assert.equal(
					await panel.evaluate((el) => getComputedStyle(el).backgroundColor),
					'rgb(37, 40, 37)',
					'opaque sort panel'
				);
				await page.locator('#codex-sort').selectOption('name');
			} else if (route === '/achievements') {
				await page.locator('.achievement-row').first().waitFor();
				assert.ok(
					await page
						.locator('.achievement-row')
						.first()
						.evaluate((el) => parseFloat(getComputedStyle(el).paddingRight) >= 16),
					'achievement right padding'
				);
			} else if (route === '/friends') {
				await page.locator('.friends-contacts').waitFor();
				if (width >= 1024) {
					const side = await page.locator('.friends-requests').boundingBox();
					assert.ok(side.width >= 360, 'request column has usable width');
				} else await page.getByRole('button', { name: /Demandes d’amitié/ }).click();
				await page.locator('#received-requests-title').waitFor();
				const name = page.locator('.friends-requests h3').first();
				assert.ok(
					await name.evaluate(
						(el) =>
							el.scrollWidth <= el.clientWidth + 1 &&
							getComputedStyle(el).textOverflow !== 'ellipsis'
					),
					'request identity readable'
				);
			} else if (route === '/market') {
				await page.locator('[data-auction-id="71"]').waitFor();
				const own = page.locator('[data-auction-id="71"] .own-auction'),
					art = page.locator('[data-auction-id="71"] .auction-art');
				const badge = await own.boundingBox(),
					card = await art.boundingBox();
				assert.ok(
					badge.x >= card.x &&
						badge.x + badge.width <= card.x + card.width + 1 &&
						badge.y < card.y + 20,
					'ownership badge on card corner'
				);
				assert.equal(
					await page
						.locator('[data-auction-id="73"] .auction-price')
						.getAttribute('data-bid-state'),
					'leading'
				);
				assert.equal(
					await page
						.locator('[data-auction-id="74"] .auction-price')
						.getAttribute('data-bid-state'),
					'outbid'
				);
				assert.notEqual(
					await page
						.locator('[data-auction-id="73"] .auction-price')
						.evaluate((el) => getComputedStyle(el).color),
					await page
						.locator('[data-auction-id="74"] .auction-price')
						.evaluate((el) => getComputedStyle(el).color),
					'winning and losing prices distinct'
				);
			}
			assert.ok(
				await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
				route + ': no overflow'
			);
			if (width === 1920)
				assert.ok(
					(await page.locator('.arcade-page').boundingBox()).width > 1800,
					'wide screens use available width'
				);
			await page.screenshot({ path: join(output, route.slice(1) + '-' + width + '.png') });
		}
		assert.deepEqual(errors, []);
		assert.deepEqual(live, []);
		await context.close();
		console.log('Player controls ' + width + 'px: passed');
	}
} finally {
	await browser.close();
}
console.log(output);
