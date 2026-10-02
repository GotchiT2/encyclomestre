import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const base = process.env.PLAN_TEST_BASE ?? 'https://dev.wikiforge.fr';
const widths = (process.env.PLAN_TEST_WIDTHS ?? '360,390,768,1024,1440').split(',').map(Number);
const output = join(tmpdir(), 'wikiforge-ui-corrections');
await mkdir(output, { recursive: true });
const picture = await readFile(
	new URL('../static/images/booster-preview/karina.jpg', import.meta.url)
);
const browser = await chromium.launch();
const report = [];

// Start observing before the click. Capture the insertion frame, then every animation frame.
async function opening(page, trigger, name, selector = '[role=dialog]') {
	await page.evaluate((selector) => {
		window.__modalFrames = [];
		window.__modalDone = new Promise((resolve) => {
			const observer = new MutationObserver(() => {
				const dialog = document.querySelector(selector);
				if (!dialog) return;
				observer.disconnect();
				const started = performance.now();
				const sample = () => {
					const r = dialog.getBoundingClientRect(),
						css = getComputedStyle(dialog);
					window.__modalFrames.push({
						time: performance.now() - started,
						x: r.x,
						y: r.y,
						w: r.width,
						h: r.height,
						opacity: Number(css.opacity),
						padding: parseFloat(css.paddingLeft)
					});
					if (performance.now() - started < 260) requestAnimationFrame(sample);
					else resolve(window.__modalFrames);
				};
				sample();
			});
			observer.observe(document.body, { childList: true, subtree: true });
		});
	}, selector);
	await trigger();
	const frames = await page.evaluate(() => window.__modalDone);
	assert.ok(frames.length > 2, name + ': animation frames captured');
	const final = frames.at(-1);
	for (const frame of frames) {
		assert.ok(
			Math.abs(frame.x + frame.w / 2 - final.x - final.w / 2) < 1,
			name + ': horizontal center stable on first frame'
		);
		assert.ok(
			Math.abs(frame.y + frame.h / 2 - final.y - final.h / 2) < 1,
			name + ': vertical center stable on first frame'
		);
	}
	assert.ok(final.x >= -1 && final.y >= -1, name + ': inside viewport');
	report.push({
		name,
		width: (await page.viewportSize()).width,
		motion: await page.evaluate(() =>
			matchMedia('(prefers-reduced-motion:reduce)').matches ? 'reduce' : 'normal'
		),
		frames
	});
	return page.locator(selector);
}
async function close(page) {
	await page.keyboard.press('Escape');
	await page.locator('[role=dialog]').waitFor({ state: 'hidden' });
}
async function tooltip(page, locator, label) {
	await page.keyboard.press('Tab');
	await locator.focus();
	const tip = page.getByTestId('icon-tooltip');
	await tip.waitFor();
	assert.equal(await tip.textContent(), label);
	assert.equal(await page.getByRole('tooltip').count(), 1, 'tooltip stays accessible in a modal');
	assert.ok(await locator.getAttribute('aria-describedby'));
	const box = await tip.boundingBox();
	assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= (await page.viewportSize()).width + 1);
	await page.keyboard.press('Escape');
}
try {
	for (const width of widths)
		for (const motion of ['no-preference', 'reduce']) {
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
				route.fulfill({ status: 200, contentType: 'image/jpeg', body: picture })
			);
			await context.addInitScript(() => {
				localStorage.setItem(
					'encyclomestre.auth-session',
					JSON.stringify({ accessToken: 'mock', user: { id: '1', username: 'Demo', role: 'user' } })
				);
				window.__requests = [];
				addEventListener('wikiforge:mock-request', (event) => window.__requests.push(event.detail));
			});
			const page = await context.newPage();
			page.setDefaultTimeout(15000);
			page.on('pageerror', (error) => {
				errors.push(error.message);
				console.error(page.url(), error.stack);
			});
			await page.goto(base + '/collection');
			await page.locator('[data-testid=card-tile]').first().waitFor();
			await page.evaluate(() => document.fonts.ready);
			assert.equal(await page.getByRole('button', { name: 'Filtres', exact: true }).count(), 0);
			assert.equal(
				await page.getByText('Progression de la collection', { exact: true }).count(),
				0
			);
			const dup = page.getByRole('combobox', { name: 'Doublons', exact: true });
			await dup.selectOption('yes');
			await page.waitForURL((url) => url.searchParams.get('duplicate') === 'yes');
			await dup.selectOption('all');
			await page.waitForURL((url) => !url.searchParams.has('duplicate'));
			assert.equal(
				await dup.evaluate((el) => getComputedStyle(el).backgroundColor),
				'rgb(32, 35, 32)'
			);
			await tooltip(
				page,
				page.getByTestId('notification-trigger'),
				await page.getByTestId('notification-trigger').getAttribute('aria-label')
			);
			await page.getByRole('button', { name: 'Étiquettes: Étiquettes', exact: true }).click();
			const management = await opening(
				page,
				() => page.getByRole('button', { name: 'Gérer les étiquettes', exact: true }).click(),
				'tag-management'
			);
			await management.getByRole('searchbox').fill('FAVOR');
			await close(page);
			// The quick sale has static dimensions and must keep all four edges stable throughout its fade.
			let found = false;
			for (const button of await page.getByTestId('card-quick-actions').all()) {
				await button.click();
				const sale = page.getByRole('menuitem', { name: 'À vendre', exact: true });
				if (await sale.isEnabled()) {
					const dialog = await opening(page, () => sale.click(), 'quick-sale');
					const frames = await page.evaluate(() => window.__modalFrames);
					for (const f of frames) {
						assert.ok(Math.abs(f.w - frames[0].w) < 1);
						assert.ok(Math.abs(f.h - frames[0].h) < 1);
					}
					assert.equal(frames[0].padding, width < 640 ? 16 : 20);
					await dialog.getByLabel('Prix', { exact: true }).fill('123');
					await page.screenshot({ path: join(output, 'sale-' + width + '-' + motion + '.png') });
					// Tooltip is visible and accessible above modal layers; Escape still closes the dialog.
					await tooltip(
						page,
						dialog.getByRole('button', { name: 'Fermer', exact: true }),
						'Fermer'
					);
					await page.locator('[role=dialog]').waitFor({ state: 'hidden' });
					found = true;
					break;
				}
				await page.keyboard.press('Escape');
			}
			assert.ok(found);
			const detail = await opening(
				page,
				() => page.locator('.card-inspect').first().click(),
				'personal-inspection',
				'[data-testid=card-detail-modal]'
			);
			const tags = detail.getByTestId('card-tag-controls');
			await tags.getByRole('searchbox').fill('Test ' + width);
			await tags.getByRole('searchbox').press('Enter');
			await tags.getByRole('button', { name: 'Test ' + width + ' ×', exact: true }).waitFor();
			assert.equal(await tags.getByRole('searchbox').inputValue(), '');
			await close(page);
			await page.goto(base + '/friends');
			await opening(
				page,
				() => page.getByRole('button', { name: 'Ajouter un ami', exact: true }).click(),
				'friend-invitation'
			);
			await close(page);
			await page.goto(base + '/wishlists');
			await opening(
				page,
				() => page.getByRole('button', { name: /Créer une wishlist/ }).click(),
				'wishlist-create'
			);
			await close(page);
			await page.goto(base + '/trades?partner=2&offerCards=90');
			const trade = page.getByRole('dialog');
			await trade.locator('.tray-card').first().waitFor();
			const own = trade.getByRole('tab', { name: /Mes cartes/ }),
				other = trade.getByRole('tab', { name: /Cartes de/ });
			await other.click();
			await trade.locator('[role=tabpanel]:visible .card-inspect').first().click();
			const search = trade.locator('[role=tabpanel]:visible input').first();
			await search.fill('Karina');
			await own.click();
			assert.equal(await trade.locator('[role=tabpanel]:visible').count(), 1);
			await other.click();
			assert.equal(await search.inputValue(), 'Karina');
			const draft = trade.getByTestId('local-draft');
			assert.ok(await draft.evaluate((el) => Boolean(el.closest('footer'))));
			await trade.getByRole('button', { name: 'Vérifier l’offre', exact: true }).click();
			await trade.locator('.trade-review').waitFor();
			await close(page);
			await page.goto(base + '/messages?user=3');
			await page.locator('textarea:visible').waitFor();
			assert.ok(
				await page
					.getByTestId('local-draft')
					.filter({ visible: true })
					.evaluate((el) => Boolean(el.closest('form')))
			);
			await page.goto(base + '/profile');
			await page.locator('.vitrine').first().waitFor();
			const vitrines = await page.locator('.vitrine').evaluateAll((elements) =>
				elements.map((el) => {
					const parent = el.parentElement,
						css = getComputedStyle(parent);
					return {
						width: el.getBoundingClientRect().width,
						available:
							parent.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight),
						cards: [...el.querySelectorAll('.vitrine__carte')].map(
							(card) => card.getBoundingClientRect().width
						)
					};
				})
			);
			for (const v of vitrines) {
				assert.ok(Math.abs(v.width - v.available) < 2);
				assert.ok(v.cards.every((w) => w <= 145));
			}
			await opening(
				page,
				() => page.getByRole('button', { name: 'Selectionner un avatar', exact: true }).click(),
				'avatar-editor'
			);
			await close(page);
			await page.goto(base + '/notifications');
			await page.getByTestId('notification-groups').waitFor();
			const group = page.locator('[data-family]').first(),
				toggle = group.locator('h2 button');
			await toggle.click();
			assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
			await toggle.click();
			assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
			await page.screenshot({
				path: join(output, 'notifications-' + width + '-' + motion + '.png')
			});
			await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
			assert.ok(
				await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
				'enlarged text stays inside viewport'
			);
			assert.deepEqual(errors, []);
			assert.deepEqual(live, []);
			await context.close();
			console.log('UI corrections passed: ' + width + 'px / ' + motion);
		}
	await writeFile(join(output, 'animation-frames.json'), JSON.stringify(report, null, 2));
	console.log('Animation evidence and screenshots: ' + output);
} finally {
	await browser.close();
}
