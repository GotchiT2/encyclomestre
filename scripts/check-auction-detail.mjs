import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';

const base = 'https://dev.wikiforge.fr';
const output = join(tmpdir(), 'wikiforge-auction-detail');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const live = [],
	errors = [],
	measures = [];
const context = await browser.newContext({ ignoreHTTPSErrors: true });
await context.route('**/*', (route) => {
	const url = new URL(route.request().url());
	if (url.hostname === 'api.wikiforge.fr' || url.pathname.startsWith('/api/')) {
		live.push(route.request().url());
		return route.abort();
	}
	return route.continue();
});
await context.addInitScript(() => {
	localStorage.setItem(
		'encyclomestre.auth-session',
		JSON.stringify({
			accessToken: 'mock-only',
			user: { id: '1', username: 'Demo', displayName: 'Demo', money: 10000, role: 'user' }
		})
	);
	window.__auctionRequests = [];
	addEventListener('wikiforge:mock-auction-request', (event) =>
		window.__auctionRequests.push(event.detail)
	);
});
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
const count = (path, method) =>
	page.evaluate(
		({ path, method }) =>
			window.__auctionRequests.filter((r) => r.path === path && r.method === method).length,
		{ path, method }
	);
const field = () => page.getByRole('spinbutton', { name: 'Votre maximum' });
async function geometry(width, label) {
	await page.waitForTimeout(100);
	const data = await page.evaluate(() => {
		const box = (selector) => {
			const node = document.querySelector(selector),
				rect = node?.getBoundingClientRect();
			return rect
				? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom }
				: null;
		};
		return {
			screen: [innerWidth, innerHeight],
			root: document.documentElement.scrollWidth,
			dock: box('[data-testid="auction-dock"]'),
			nav: box('[data-mobile-tabs]'),
			form: box('.bid-line'),
			quick: box('.bid-panel > div button'),
			history: box('[data-testid="auction-history"]')
		};
	});
	assert.ok(data.root <= width + 1, 'No horizontal overflow: ' + label);
	assert.ok(
		data.dock.x >= -1 && data.dock.x + data.dock.width <= width + 1,
		'Dock stays in viewport: ' + label
	);
	assert.ok(data.dock.y >= 0, 'Dock stays below header: ' + label);
	if (width < 1024)
		assert.ok(Math.abs(data.dock.bottom - data.nav.y) <= 2, 'Dock above navigation: ' + label);
	else assert.ok(data.dock.y >= 87 && data.dock.x > width / 2, 'Dock remains on right: ' + label);
	assert.ok(
		data.form.y >= data.dock.y && data.form.bottom <= data.dock.bottom + 1,
		'Bid form visible: ' + label
	);
	assert.ok(data.quick.bottom <= data.dock.bottom + 1, 'Quick bid visible: ' + label);
	measures.push({ width, label, ...data });
}
try {
	for (const width of [360, 390, 768, 1024, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(base + '/market/70');
		await field().waitFor();
		assert.ok(await count('/auctions/70', 'GET'), 'Mocks required before any write');
		assert.equal(
			await page.getByRole('button', { name: 'Détail de la carte', exact: true }).count(),
			0
		);
		assert.equal(await page.getByTestId('auction-history').evaluate((n) => n.open), true);
		assert.equal(await page.getByTestId('auction-player').count(), 2);
		assert.ok(await page.getByTestId('auction-countdown').isVisible());
		const date = page.getByTestId('auction-countdown').locator('..').locator('p');
		assert.ok(await date.isVisible());
		assert.ok(!(await date.innerText()).includes('locale'));
		await geometry(width, 'initial');
		await field().fill('500');
		await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
		await page.waitForTimeout(150);
		await geometry(width, 'scrolled');
		await page.screenshot({ path: join(output, `detail-${width}.png`) });
		await page.getByRole('button', { name: 'Informations', exact: true }).click();
		await page.getByRole('dialog').waitFor();
		await page.keyboard.press('Escape');
		await field().press('Tab');
		assert.ok(await page.evaluate(() => document.activeElement !== document.body));
		await page.getByRole('button', { name: /Mise rapide.*150/ }).click();
		await page.getByRole('button', { name: /Mise rapide.*160/ }).waitFor();
		assert.equal(await count('/auctions/70/bids', 'POST'), 1);
		assert.equal(await page.getByRole('dialog').count(), 0);
		assert.equal(await field().inputValue(), '');
		await page.evaluate(() => (document.documentElement.style.fontSize = '125%'));
		await geometry(width, 'text125');
		await page.evaluate(() => (document.documentElement.style.fontSize = ''));
	}
	await page.setViewportSize({ width: 390, height: 600 });
	await page.goto(base + '/market/70');
	await field().waitFor();
	await field().fill('500');
	await field().focus();
	await geometry(390, 'short-focused');
	await page.setViewportSize({ width: 1440, height: 900 });
	assert.equal(await field().inputValue(), '500', 'Resize retains draft');
	await page.getByRole('button', { name: 'Confirmer mon maximum', exact: true }).click();
	assert.equal(await count('/auctions/70/bids', 'POST'), 0);
	await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
	await page.getByRole('button', { name: /Mise rapide.*501/ }).waitFor();
	assert.equal(await field().inputValue(), '');
	await field().fill('600');
	await page.evaluate(() => sessionStorage.setItem('wikiforge-auction-scenario', 'conflict'));
	await page.getByRole('button', { name: /Mise rapide.*501/ }).click();
	await page.getByRole('alert').filter({ hasText: 'Votre saisie est conservée' }).waitFor();
	assert.equal(await count('/auctions/70/bids', 'POST'), 2);
	assert.equal(await field().inputValue(), '600');
	await field().fill('650');
	assert.equal(
		await page.getByRole('alert').filter({ hasText: 'Votre saisie est conservée' }).count(),
		0
	);
	await page.evaluate(() => sessionStorage.removeItem('wikiforge-auction-scenario'));
	await page.getByRole('button', { name: 'Récupérer le surplus', exact: true }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
	await page.getByRole('dialog').waitFor({ state: 'hidden' });
	assert.equal(await count('/auctions/70/max', 'DELETE'), 1);
	await page.locator('[data-testid="card-tile"] .card-inspect').click();
	await page.getByTestId('card-detail-modal').waitFor();
	await page.keyboard.press('Escape');
	await page.getByTestId('card-detail-modal').waitFor({ state: 'hidden' });
	for (const id of [71, 72, 75, 79, 80]) {
		await page.goto(base + '/market/' + id);
		await page.getByTestId('auction-dock').waitFor();
		if ([75, 80].includes(id))
			assert.equal(await page.getByRole('button', { name: /Mise rapide/ }).count(), 0);
		if (id === 79)
			assert.equal(await page.getByRole('button', { name: /Mise rapide/ }).isDisabled(), true);
		if (id === 80) assert.equal(await page.getByTestId('auction-player').count(), 1);
	}
	assert.deepEqual(live, [], 'No live API requests');
	assert.deepEqual(errors, [], 'No browser errors');
	await writeFile(join(output, 'measurements.json'), JSON.stringify(measures, null, 2));
	console.log(JSON.stringify({ passed: true, measurements: measures.length, output }));
} catch (error) {
	console.log(
		JSON.stringify({
			url: page.url(),
			live,
			errors,
			body: (await page.locator('body').innerText()).slice(-3500)
		})
	);
	await page.screenshot({ path: join(output, 'failure.png') });
	throw error;
} finally {
	await browser.close();
}
