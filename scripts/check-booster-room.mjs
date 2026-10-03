import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const base = process.env.PLAN_TEST_BASE ?? 'https://dev.wikiforge.fr';
const output = join(tmpdir(), 'wikiforge-booster-room');
await mkdir(output, { recursive: true });
const picture = await readFile(
	new URL('../static/images/booster-preview/karina.jpg', import.meta.url)
);
const browser = await chromium.launch();
const report = [];
const widths = (process.env.PLAN_TEST_WIDTHS ?? '360,390,768,1024,1440')
	.split(',')
	.filter(Boolean)
	.map(Number);
async function setup({
	width = 1440,
	motion = 'no-preference',
	scenario = 'opening-fixtures',
	express = false,
	noWebGL = false,
	slow = false,
	video = false
} = {}) {
	const context = await browser.newContext({
		viewport: { width, height: width < 600 ? 844 : 950 },
		ignoreHTTPSErrors: true,
		hasTouch: width < 1024,
		reducedMotion: motion,
		...(video ? { recordVideo: { dir: output } } : {})
	});
	const live = [],
		errors = [];
	await context.route('https://api.wikiforge.fr/**', (route) => {
		live.push(route.request().url());
		return route.abort();
	});
	await context.route('https://upload.wikimedia.org/**', (route) =>
		route.fulfill({ status: 200, contentType: 'image/jpeg', body: picture })
	);
	await context.addInitScript(
		({ scenario, express, noWebGL, slow }) => {
			if (!localStorage.getItem('encyclomestre.auth-session'))
				localStorage.setItem(
					'encyclomestre.auth-session',
					JSON.stringify({ accessToken: 'mock', user: { id: '1', username: 'Demo', role: 'user' } })
				);
			if (!sessionStorage.getItem('wikiforge-plan-scenario'))
				sessionStorage.setItem('wikiforge-plan-scenario', scenario);
			if (express)
				localStorage.setItem(
					'encyclomestre.arcade.preferences',
					JSON.stringify({ density: 'grid', opening: 'express', motion: 'system' })
				);
			window.__requests = [];
			addEventListener('wikiforge:mock-request', (event) => window.__requests.push(event.detail));
			if (slow) Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 });
			if (noWebGL) {
				const original = HTMLCanvasElement.prototype.getContext;
				HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
					return /webgl/i.test(kind) ? null : original.call(this, kind, ...args);
				};
			}
		},
		{ scenario, express, noWebGL, slow }
	);
	const page = await context.newPage();
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto(base + '/boosters');
	await page.getByTestId('booster-open-one').waitFor();
	await page.waitForFunction(
		() => document.querySelector('[data-testid=booster-open-one]')?.disabled === false
	);
	const state = { context, page, live, errors };
	return state;
}
const posts = (page) =>
	page.evaluate(
		() =>
			window.__requests.filter((r) => r.method === 'POST' && /\/boosters\/\d+\/open/.test(r.path))
				.length
	);
const receipt = (page) =>
	page.evaluate(() => JSON.parse(sessionStorage.getItem('encyclomestre.arcade.opening.1')));
async function clean(state, label) {
	assert.deepEqual(state.live, [], label + ': no production requests');
	assert.deepEqual(state.errors, [], label + ': no page errors');
	report.push({ label, posts: await posts(state.page) });
	await state.context.close();
	console.log(label + ': passed');
}
async function bounds(page) {
	const frame = await page.locator('.booster-theatre').boundingBox();
	const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
	assert.ok(
		frame && Math.abs(frame.x) < 1 && Math.abs(frame.y) < 1,
		'opening frame starts at viewport origin'
	);
	assert.ok(
		Math.abs(frame.width - viewport.width) < 1 && Math.abs(frame.height - viewport.height) < 1,
		'opening frame fills the viewport'
	);
	assert.ok(
		await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
		'no document overflow'
	);
	for (const box of await page.locator('.booster-card-button').evaluateAll((buttons) =>
		buttons.map((b) => {
			const r = b.getBoundingClientRect();
			return { w: r.width, h: r.height };
		})
	)) {
		assert.ok(
			box.w <= 144.5 && box.w >= 44 && box.h >= 44,
			'compact stable cards with touch targets'
		);
	}
}
async function skip(page) {
	const skip = page.getByRole('button', { name: 'Passer l’animation', exact: true });
	await skip.waitFor();
	await skip.click();
	await page.getByTestId('discovery-board').waitFor();
}
try {
	for (const width of widths)
		for (const motion of ['no-preference', 'reduce']) {
			const state = await setup({
					width,
					motion,
					scenario: 'opening-pending',
					video: width === 1440 && motion === 'no-preference'
				}),
				{ page } = state;
			await page.screenshot({ path: join(output, `reserve-${width}-${motion}.png`) });
			await page.locator('.family-credit').first().waitFor();
			assert.equal(await page.locator('.family-credit').count(), 3, 'one reserve per family');
			await page.locator('[data-testid=pack-carousel][data-ready=true]').waitFor();
			await page.getByTestId('booster-open-one').evaluate((button) => {
				button.click();
				button.click();
			});
			const theatre = page.locator('.booster-theatre');
			await theatre.getByText('Préparation de vos cartes…', { exact: true }).first().waitFor();
			await bounds(page);
			assert.equal(await page.getByTestId('discovery-board').count(), 0, 'closed before response');
			await page.waitForFunction(() =>
				window.__requests.some((r) => r.method === 'POST' && r.path.includes('/open'))
			);
			assert.equal(await posts(page), 1, 'double click makes one acquisition');
			if (width === 1440 && motion === 'no-preference') {
				for (const [percent, name] of [
					[10, 'tension'],
					[38, 'tear'],
					[60, 'release']
				]) {
					await page.waitForFunction(
						(percent) =>
							Number(
								document.querySelector('.booster-theatre [data-progress]')?.dataset.progress
							) >= percent,
						percent
					);
					await page.screenshot({ path: join(output, `ceremony-${name}.png`) });
				}
			}
			await page.locator('.booster-card-button:not([disabled])').first().waitFor();
			await bounds(page);
			const third = page.locator('.booster-card-button').nth(2),
				before = await third.boundingBox();
			await third.focus();
			await page.keyboard.press('Enter');
			const saved = await receipt(page);
			assert.deepEqual(saved.revealedIds, [saved.cardIds[2]], 'player chooses third card first');
			await third.evaluate((button) =>
				Promise.all(
					button
						.getAnimations({ subtree: true })
						.map((animation) => animation.finished.catch(() => undefined))
				)
			);
			const after = await third.boundingBox();
			assert.ok(
				Math.abs(after.width - before.width) < 1 && Math.abs(after.height - before.height) < 1,
				'turning returns to the same slot'
			);
			await third.click();
			await page.getByTestId('card-detail-modal').waitFor();
			await page.keyboard.press('Escape');
			await page.getByTestId('card-detail-modal').waitFor({ state: 'hidden' });
			await page.waitForFunction(
				() =>
					document.activeElement?.closest('[data-card-id]')?.getAttribute('data-card-id') ===
					JSON.parse(sessionStorage.getItem('encyclomestre.arcade.opening.1')).cardIds[2],
				undefined,
				{ timeout: 1500 }
			);
			await page.getByRole('button', { name: 'Tout révéler', exact: true }).click();
			await page.getByText('Les cartes sont dans votre collection', { exact: true }).waitFor();
			await page.screenshot({ path: join(output, `summary-${width}-${motion}.png`) });
			assert.equal(await posts(page), 1);
			await clean(state, `layout-${width}-${motion}`);
		}
	{
		const state = await setup({ scenario: 'opening-pending' }),
			{ page } = state;
		await page.getByTestId('booster-open-one').click();
		await page.getByText('Préparation de vos cartes…', { exact: true }).first().waitFor();
		await page.getByRole('button', { name: 'Quitter la découverte', exact: true }).click();
		await page.locator('.booster-theatre').waitFor({ state: 'hidden' });
		await page.getByText('Votre dernière découverte vous attend', { exact: true }).waitFor();
		assert.equal(await posts(page), 1);
		await page.getByRole('button', { name: 'Reprendre la découverte', exact: true }).click();
		await page.locator('.booster-card-button').nth(4).click();
		const saved = await receipt(page);
		await page.reload();
		await page.getByRole('button', { name: 'Reprendre la découverte', exact: true }).click();
		await page.locator('[data-revealed=true]').waitFor();
		assert.deepEqual((await receipt(page)).revealedIds, [saved.cardIds[4]]);
		assert.equal(await posts(page), 0, 'reload/resume only performs reads');
		await page.getByRole('button', { name: 'Quitter la découverte', exact: true }).click();
		await page.evaluate(
			(saved) =>
				sessionStorage.setItem(
					'encyclomestre.arcade.opening.1',
					JSON.stringify({
						accountId: saved.accountId,
						packId: saved.packId,
						cardIds: saved.cardIds,
						openedCount: saved.openedCount,
						revealed: 2,
						index: 2
					})
				),
			saved
		);
		await page.reload();
		await page.getByRole('button', { name: 'Reprendre la découverte', exact: true }).click();
		await page.waitForFunction(
			() => document.querySelectorAll('[data-revealed=true]').length === 2
		);
		assert.equal(
			await page.locator('[data-revealed=true]').count(),
			2,
			'old sequential receipt migrated'
		);
		await clean(state, 'pending-close-resume-migration');
	}
	{
		const state = await setup(),
			{ page } = state;
		await page.getByRole('button', { name: 'Ouvrir le lot disponible', exact: true }).click();
		await page.getByRole('button', { name: 'Confirmer', exact: true }).click();
		await skip(page);
		const saved = await receipt(page);
		assert.equal(saved.cardIds.length, 55);
		assert.equal(await page.locator('.booster-card-button').count(), 12);
		await page.getByRole('button', { name: 'Page suivante', exact: true }).click();
		await page.locator('.booster-card-button').nth(1).click();
		assert.deepEqual((await receipt(page)).revealedIds, [saved.cardIds[13]]);
		await page.getByRole('button', { name: 'Tout révéler', exact: true }).click();
		assert.equal((await receipt(page)).revealedIds.length, 55, 'all pages revealed');
		await page.getByRole('button', { name: 'Page suivante', exact: true }).click();
		assert.equal(await page.locator('[data-revealed=true]').count(), 12);
		assert.equal(await posts(page), 1);
		await clean(state, 'batch-pages-skip-all');
	}
	for (const scenario of [
		'conflict',
		'uncertain-opening',
		'uncertain-opening-read-error',
		'stock-limited'
	]) {
		const state = await setup({ express: true }),
			{ page } = state;
		await page.evaluate(
			(scenario) => sessionStorage.setItem('wikiforge-plan-scenario', scenario),
			scenario
		);
		if (scenario === 'stock-limited') {
			await page.getByRole('button', { name: 'Ouvrir le lot disponible', exact: true }).click();
			await page.getByRole('button', { name: 'Confirmer', exact: true }).click();
			await page.getByText('2 boosters ouverts · 9 crédits restants', { exact: true }).waitFor();
			assert.equal(
				await page.getByRole('button', { name: 'Ouvrir un autre booster', exact: true }).count(),
				0,
				'exhausted pack cannot reopen'
			);
		} else {
			await page.getByTestId('booster-open-one').click();
			await page.locator('.booster-theatre [role=alert]').waitFor();
			assert.equal(await page.getByTestId('discovery-board').count(), 0, 'no invented result');
			if (scenario === 'conflict')
				await page.getByText(/La disponibilité du paquet a changé/).waitFor();
			else {
				await page.waitForFunction(() =>
					window.__requests.some((r) => r.method === 'GET' && r.path.startsWith('/collection?'))
				);
				assert.ok(
					await page.evaluate(() =>
						window.__requests.some((r) => r.method === 'GET' && r.path.startsWith('/collection?'))
					),
					'uncertain acquisition reread'
				);
			}
			if (scenario === 'uncertain-opening-read-error') {
				await page.getByRole('button', { name: 'Quitter la découverte', exact: true }).click();
				assert.ok(
					await page.getByTestId('booster-open-one').isDisabled(),
					'no retry while credits unreadable'
				);
			}
		}
		assert.equal(await posts(page), 1);
		await clean(state, scenario);
	}
	for (const pack of [
		{ id: 2, visual: 'circuit' },
		{ id: 3, visual: 'prism' }
	]) {
		const state = await setup({ express: true }),
			{ page } = state;
		await page.locator(`[data-pack-id="${pack.id}"]`).click();
		await page.locator(`.hero-lane .pack-object.chosen [data-visual=${pack.visual}]`).waitFor();
		await page.getByTestId('booster-open-one').click();
		await page.getByText('Les cartes sont dans votre collection', { exact: true }).waitFor();
		assert.equal(
			await page.getByRole('button', { name: 'Passer l’animation', exact: true }).count(),
			0,
			'express skips ceremony'
		);
		assert.equal(await posts(page), 1);
		await clean(state, `model-${pack.visual}-express`);
	}
	for (const kind of ['absent', 'lost', 'slow']) {
		const state = await setup({ noWebGL: kind === 'absent', slow: kind === 'slow' }),
			{ page } = state;
		await page.getByTestId('booster-open-one').click();
		if (kind === 'lost') {
			await page.locator('.booster-theatre [data-renderer=webgl]').waitFor();
			await page.locator('.booster-theatre canvas').evaluate((canvas) => {
				const extension = canvas.getContext('webgl2').getExtension('WEBGL_lose_context');
				if (extension) extension.loseContext();
				else canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
			});
			await page.locator('.booster-theatre [data-renderer=dom]').waitFor();
		}
		await page.locator('.booster-card-button:not([disabled])').first().waitFor();
		await page.getByRole('button', { name: 'Tout révéler', exact: true }).click();
		assert.equal(await posts(page), 1);
		await clean(state, 'webgl-' + kind);
	}
	{
		const state = await setup({ width: 390 }),
			{ page } = state;
		const lane = page.locator('.hero-lane'),
			box = await lane.boundingBox();
		const touch = await state.context.newCDPSession(page);
		await touch.send('Input.dispatchTouchEvent', {
			type: 'touchStart',
			touchPoints: [{ x: box.x + 200, y: box.y + box.height * 0.65 }]
		});
		for (let x = 180; x >= 80; x -= 20)
			await touch.send('Input.dispatchTouchEvent', {
				type: 'touchMove',
				touchPoints: [{ x: box.x + x, y: box.y + box.height * 0.65 }]
			});
		await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
		await page.locator('.hero-lane .pack-object.chosen [data-visual=circuit]').waitFor();
		assert.equal(await posts(page), 0, 'swiping the reserve does not acquire');
		await page
			.locator('.pack-navigation')
			.getByRole('button', { name: 'Pack précédent', exact: true })
			.click();
		await page.getByRole('button', { name: 'Voir tous les packs', exact: true }).click();
		await page.getByRole('heading', { name: 'Prêts à ouvrir', exact: true }).waitFor();
		await page.keyboard.press('Escape');
		await lane.dispatchEvent('pointerdown', {
			pointerType: 'touch',
			clientX: box.x + 90,
			clientY: box.y + 20
		});
		await lane.dispatchEvent('pointerup', {
			pointerType: 'touch',
			clientX: box.x + 180,
			clientY: box.y + 20
		});
		await skip(page);
		assert.equal(await posts(page), 1, 'tear acquires once');
		await clean(state, 'swipe-dock-tear');
	}
	{
		const state = await setup(),
			{ page } = state;
		await page.getByTestId('booster-open-one').click();
		await page.waitForFunction(
			() =>
				Number(document.querySelector('.booster-theatre [data-progress]')?.dataset.progress) >= 10
		);
		const paused = await page.evaluate(() => {
			const value = Number(
				document.querySelector('.booster-theatre [data-progress]').dataset.progress
			);
			window.__background = true;
			Object.defineProperty(document, 'hidden', {
				configurable: true,
				get: () => window.__background
			});
			document.dispatchEvent(new Event('visibilitychange'));
			return value;
		});
		await page.waitForTimeout(450);
		assert.equal(
			await page.locator('.booster-theatre [data-progress]').getAttribute('data-progress'),
			String(paused),
			'scene pauses in background'
		);
		await page.evaluate(() => {
			window.__background = false;
			document.dispatchEvent(new Event('visibilitychange'));
		});
		await page.locator('.booster-card-button:not([disabled])').first().waitFor();
		assert.equal(await posts(page), 1);
		await clean(state, 'visibility-resume');
	}
	{
		const state = await setup({ scenario: 'opening-pending' }),
			{ page } = state;
		await page.getByTestId('booster-open-one').click();
		await page.waitForFunction(() =>
			window.__requests.some((r) => r.method === 'POST' && r.path.includes('/open'))
		);
		await page.evaluate(async () => {
			const session = await import('/src/lib/auth/session.ts');
			session.clearSession(localStorage);
		});
		await page.waitForTimeout(1200);
		assert.equal(
			await page.evaluate(() => sessionStorage.getItem('encyclomestre.arcade.opening.1')),
			null,
			'late result cannot restore logged-out receipt'
		);
		assert.equal(await posts(page), 1);
		await clean(state, 'logout-pending');
	}
	{
		const state = await setup(),
			{ page } = state;
		await page.getByRole('button', { name: 'Express', exact: true }).click();
		await page.reload();
		await page.waitForFunction(
			() => document.querySelector('[data-testid=booster-open-one]')?.disabled === false
		);
		assert.equal(
			await page.getByRole('button', { name: 'Express', exact: true }).getAttribute('aria-pressed'),
			'true'
		);
		await page.getByTestId('booster-open-one').click();
		await page.getByText('Les cartes sont dans votre collection', { exact: true }).waitFor();
		assert.equal(await posts(page), 1);
		await clean(state, 'express-preference');
	}
	{
		const state = await setup({ width: 360, motion: 'reduce', express: true }),
			{ page } = state;
		await page.addStyleTag({ content: 'html{font-size:32px!important}' });
		await page.getByTestId('booster-open-one').click();
		await page.getByText('Les cartes sont dans votre collection', { exact: true }).waitFor();
		await bounds(page);
		const close = await page
			.getByRole('button', { name: 'Quitter la découverte', exact: true })
			.boundingBox();
		assert.ok(close.x >= 0 && close.x + close.width <= 360, 'close accessible with enlarged text');
		await clean(state, 'text-enlarged');
	}
} finally {
	await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
	await browser.close();
}
console.log(JSON.stringify({ output, scenarios: report.length }));
