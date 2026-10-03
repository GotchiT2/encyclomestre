import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.ARCADE_TEST_BASE ?? 'https://dev.wikiforge.fr';
const widths = (process.env.ARCADE_TEST_WIDTHS ?? '360,390,768,1024,1440').split(',').map(Number);
const publicRoutes = ['/', '/login', '/register', '/recovery', '/legal', '/privacy', '/terms'];
const playerRoutes = [
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
	'/moderation/1',
	'/welcome',
	'/arcade/validation'
];
const browser = await chromium.launch();
try {
	for (const width of widths) {
		for (const authenticated of [false, true]) {
			const context = await browser.newContext({
				viewport: { width, height: 950 },
				hasTouch: width <= 768,
				ignoreHTTPSErrors: true,
				reducedMotion: 'reduce'
			});
			const errors = [],
				live = [];
			await context.route('https://api.wikiforge.fr/**', (route) => {
				live.push(route.request().url());
				return route.abort();
			});
			if (authenticated)
				await context.addInitScript(() =>
					localStorage.setItem(
						'encyclomestre.auth-session',
						JSON.stringify({
							accessToken: 'mock',
							user: { id: '1', username: 'Demo', role: 'user' }
						})
					)
				);
			const page = await context.newPage();
			page.on('pageerror', (error) => errors.push(error.message));
			for (const path of authenticated ? playerRoutes : publicRoutes) {
				await page.goto(base + path, { waitUntil: 'domcontentloaded' });
				await page.locator('h1').first().waitFor();
				await page.waitForTimeout(100);
				assert.ok(
					await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
					'Overflow ' + width + ' ' + path
				);
				const small = await page
					.locator('button:not([disabled]),[role=button],[role=tab],select,summary,[role=combobox]')
					.evaluateAll((nodes) =>
						nodes
							.map((el) => {
								const r = el.getBoundingClientRect();
								return {
									label: (el.getAttribute('aria-label') || el.textContent).trim().slice(0, 40),
									w: r.width,
									h: r.height
								};
							})
							.filter((x) => x.w && x.h && (x.w < 43.9 || x.h < 43.9))
					);
				assert.deepEqual(small, [], 'Touch targets ' + width + ' ' + path);
				assert.equal(await page.locator('audio').count(), 0);
				if (width === 360 || width === 1440) {
					await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
					assert.ok(
						await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
						'Enlarged text ' + width + ' ' + path
					);
					await page.evaluate(() => (document.documentElement.style.fontSize = ''));
				}
			}
			assert.deepEqual(errors, []);
			assert.deepEqual(live, []);
			await context.close();
		}
		console.log('Public and player pages, touch targets and reduced motion: ' + width + 'px');
	}
} finally {
	await browser.close();
}
