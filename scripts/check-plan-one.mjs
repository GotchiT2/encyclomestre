import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const base = process.env.PLAN_TEST_BASE ?? 'https://localhost:5180';
const browser = await chromium.launch();
const folder = join(tmpdir(), 'encyclomestre-plan-one');
await mkdir(folder, { recursive: true });
const widths = (process.env.PLAN_TEST_WIDTHS ?? '360,390,768,1024,1440').split(',').map(Number);
const routes = [
	'/',
	'/collection',
	'/cards',
	'/cards/1',
	'/boosters',
	'/packs/1',
	'/wishlists',
	'/wishlist',
	'/market',
	'/market/70',
	'/trades',
	'/friends',
	'/messages',
	'/guild',
	'/guilds/1?tab=chat',
	'/guilds/1?tab=members',
	'/guilds/1?tab=manage',
	'/profile',
	'/users/2',
	'/settings',
	'/achievements',
	'/leaderboard',
	'/notifications',
	'/moderation',
	'/moderation/1',
	'/boosters/apercu'
];
const seed = {
	accessToken: 'mock',
	user: { id: '1', username: 'Demo', displayName: 'Demo', role: 'user', money: 10000 }
};
async function context(width, session = true) {
	const ctx = await browser.newContext({
		ignoreHTTPSErrors: true,
		viewport: { width, height: 950 },
		reducedMotion: 'reduce',
		hasTouch: width <= 768
	});
	await ctx.route('https://api.wikiforge.fr/**', (route) => {
		throw new Error('Live API forbidden: ' + route.request().url());
	});
	if (session)
		await ctx.addInitScript(
			(value) => localStorage.setItem('encyclomestre.auth-session', JSON.stringify(value)),
			seed
		);
	return ctx;
}
async function contained(page, label) {
	assert.ok(
		await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
		'Viewport overflow ' + label
	);
}
try {
	for (const width of widths) {
		const ctx = await context(width),
			page = await ctx.newPage(),
			errors = [];
		page.on('pageerror', (error) => errors.push(error.message));
		for (const route of routes) {
			console.log('Audit ' + width + ' ' + route);
			await page.goto(base + route);
			await page.locator('h1').first().waitFor();
			await page.waitForTimeout(130);
			await contained(page, route + ' ' + width);
		}
		await page.goto(base + '/wishlists');
		const create = page.getByRole('button', { name: 'Créer une wishlist', exact: true });
		await create.waitFor();
		const box = await create.boundingBox();
		assert.ok(
			box && box.x >= 0 && box.x + box.width <= width + 1,
			'Wishlist create clipped ' + width
		);
		await page.goto(base + '/collection');
		const tiles = page.locator('[data-testid=card-tile]');
		await tiles.first().waitFor();
		await tiles.first().getByRole('button').first().click();
		const detail = page.locator('[data-testid=card-detail-modal]');
		await detail.waitFor();
		await detail.getByRole('button', { name: 'Vente immédiate', exact: true }).waitFor();
		await page.keyboard.press('Tab');
		assert.ok(
			await detail.evaluate((el) => el.contains(document.activeElement)),
			'Modal keyboard focus'
		);
		await page.screenshot({ path: join(folder, 'collection-modal-' + width + '.png') });
		await page.keyboard.press('Escape');
		await page.goto(base + '/messages');
		await page.locator('h1').waitFor();
		await page.getByRole('button', { name: 'Nouveau message', exact: true }).click();
		await page.getByRole('dialog').waitFor();
		await contained(page, 'new message ' + width);
		await page.keyboard.press('Escape');
		assert.deepEqual(errors, [], 'Runtime errors ' + width);
		await ctx.close();
		const guest = await context(width, false),
			account = await guest.newPage();
		const accountErrors = [];
		account.on('pageerror', (e) => accountErrors.push(e.message));
		for (const route of ['/', '/login', '/register', '/recovery', '/legal', '/privacy', '/terms']) {
			await account.goto(base + route);
			await account.locator('h1').first().waitFor();
			await contained(account, route + ' ' + width);
		}
		await account.goto(base + '/collection');
		await account.waitForURL('**/login?redirectTo=*');
		const cdp = await guest.newCDPSession(account);
		await cdp.send('WebAuthn.enable');
		await cdp.send('WebAuthn.addVirtualAuthenticator', {
			options: {
				protocol: 'ctap2',
				transport: 'internal',
				hasResidentKey: true,
				hasUserVerification: true,
				isUserVerified: true,
				automaticPresenceSimulation: true
			}
		});
		await account.goto(base + '/register');
		await account.getByLabel('Pseudonyme', { exact: true }).fill('Collector' + width);
		await account.getByRole('button', { name: 'Créer une passkey', exact: true }).click();
		await account.getByRole('heading', { name: 'Codes de secours', exact: true }).waitFor();
		const codes = await account.locator('li').allTextContents();
		assert.equal(codes.length, 10);
		assert.equal(
			await account.evaluate(() => localStorage.getItem('encyclomestre.auth-session')),
			null,
			'Session waits for code acknowledgement'
		);
		await account.getByLabel('J’ai conservé mes codes dans un endroit sûr.').check();
		await account.getByRole('button', { name: 'Entrer dans le jeu', exact: true }).click();
		await account.waitForURL(base + '/');
		const saved = await account.evaluate(() => localStorage.getItem('encyclomestre.auth-session'));
		assert.ok(saved);
		assert.ok(
			codes.every((code) => !saved.includes(code)),
			'Backup codes persisted'
		);
		assert.deepEqual(accountErrors, [], 'Account runtime errors ' + width);
		await guest.close();
		console.log('Plan 1: pages, modals, public access and signup validated at ' + width + 'px');
	}
} finally {
	await browser.close();
}
