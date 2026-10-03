import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { flamePath, wordmarkPath } from '../src/lib/brand/artwork.js';

const base = 'https://dev.wikiforge.fr';
const output = join(tmpdir(), 'wikiforge-brand');
await mkdir(output, { recursive: true });
const picture = await readFile(
	new URL('../static/images/booster-preview/karina.jpg', import.meta.url)
);
const browser = await chromium.launch();
const report = [];
try {
	for (const width of [360, 390, 768, 1024, 1440]) {
		for (const authenticated of [false, true]) {
			const context = await browser.newContext({
				viewport: { width, height: 950 },
				ignoreHTTPSErrors: true,
				hasTouch: width < 1024,
				reducedMotion: 'reduce'
			});
			const remote = [],
				errors = [];
			await context.route('https://api.wikiforge.fr/**', (route) => {
				remote.push(route.request().url());
				return route.abort();
			});
			await context.route('https://upload.wikimedia.org/**', (route) =>
				route.fulfill({ status: 200, contentType: 'image/jpeg', body: picture })
			);
			await context.addInitScript((authenticated) => {
				if (authenticated)
					localStorage.setItem(
						'encyclomestre.auth-session',
						JSON.stringify({
							accessToken: 'mock-only',
							user: { id: '1', username: 'Demo', role: 'user', money: 10000 }
						})
					);
				window.__brandRequests = [];
				addEventListener('wikiforge:mock-request', (event) =>
					window.__brandRequests.push(event.detail)
				);
			}, authenticated);
			const page = await context.newPage();
			page.on('pageerror', (error) => errors.push(error.message));
			const routes = authenticated
				? [
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
						'/guilds/1',
						'/profile',
						'/users/2',
						'/settings',
						'/achievements',
						'/leaderboard',
						'/notifications',
						'/moderation',
						'/moderation/1',
						'/welcome',
						'/arcade/validation',
						'/boosters/apercu'
					]
				: ['/', '/login', '/register', '/recovery', '/legal', '/privacy', '/terms'];
			for (const route of routes) {
				const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' });
				assert.ok(response?.status() < 400, route + ': route must exist');
				await page.locator('.brand-emblem [data-brand]').waitFor();
				if (route === '/boosters') await page.getByTestId('booster-open-one').waitFor();
				if (route === '/collection') await page.getByTestId('card-tile').first().waitFor();
				await page.evaluate(() => document.fonts.ready);
				await page.waitForTimeout(200);
				assert.equal(await page.locator('.brand-emblem path').getAttribute('d'), flamePath);
				assert.ok(
					await page.title().then((title) => !/encyclomestre|svelte/i.test(title)),
					route + ': old title'
				);
				assert.ok(
					await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
					`${width} ${route}: overflow`
				);
				const logo = await page.locator('.brand-emblem').boundingBox();
				assert.ok(
					logo && logo.width >= 32 && logo.height >= 32 && logo.x >= 0,
					route + ': visible logo'
				);
				if (width >= 1280) {
					const name = await page.locator('.brand-name .brand-wordmark').boundingBox();
					assert.ok(
						name && Math.abs(name.y + name.height / 2 - (logo.y + logo.height / 2)) < 0.5,
						route + ': header symbol and name are vertically centered'
					);
				}
				assert.equal(
					await page.locator('[data-brand-kind=symbol]').evaluateAll((elements) =>
						elements.every((el) => {
							if (!el.getClientRects().length) return true;
							const box = el.getBoundingClientRect(),
								svg = el.querySelector('svg').getBoundingClientRect();
							return (
								box.height > 0 &&
								svg.x >= box.x - 0.5 &&
								svg.y >= box.y - 0.5 &&
								svg.right <= box.right + 0.5 &&
								svg.bottom <= box.bottom + 0.5
							);
						})
					),
					true,
					route + ': symbols stay inside their slots'
				);
				if (route === '/')
					assert.equal(
						await page.locator('.graphic-print svg').evaluate((el) => {
							const box = el.closest('.landing-objects').getBoundingClientRect(),
								svg = el.getBoundingClientRect();
							return svg.bottom <= box.bottom + 0.5;
						}),
						true,
						'Landing symbol cannot overlap the next section'
					);
				assert.ok(
					(await page.locator('.arcade-brand').getAttribute('aria-label')).includes('WikiForge')
				);
				assert.equal(
					await page.locator('link[rel=manifest]').getAttribute('href'),
					'/site.webmanifest'
				);
				assert.equal(
					await page.locator('meta[property="og:image"]').getAttribute('content'),
					base + '/brand/v1/social-card.png'
				);
				if (route === '/login')
					assert.equal(
						await page
							.locator('[data-brand-kind=signature] .brand-wordmark path')
							.getAttribute('d'),
						wordmarkPath
					);
				if (
					(width === 390 || width === 1440) &&
					['/', '/login', '/boosters', '/collection'].includes(route)
				)
					await page.screenshot({
						path: join(
							output,
							`${authenticated ? 'player' : 'public'}-${route.replaceAll('/', '') || 'landing'}-${width}.png`
						)
					});
				report.push({ width, route, authenticated });
			}
			await page.goto(base + '/login');
			await page.locator('.arcade-brand').focus();
			assert.equal(
				await page.locator('.arcade-brand').evaluate((el) => el.matches(':focus-visible')),
				true
			);
			await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
			assert.ok(
				await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
				'Enlarged text'
			);
			assert.deepEqual(remote, [], 'No production requests');
			assert.deepEqual(errors, [], 'No page errors');
			await context.close();
		}
		console.log(`Brand verified at ${width}px, public and player pages.`);
	}
	await writeFile(join(output, 'report.json'), JSON.stringify(report, null, '\t'));
	console.log(`Validated ${report.length} page/width combinations. Screenshots: ${output}`);
} finally {
	await browser.close();
}
