import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.env.PLAN_TEST_BASE ?? 'https://dev.wikiforge.fr';
const output = join(tmpdir(), 'wikiforge-booster-carousel');
await mkdir(output, { recursive: true });
const picture = await readFile(
	new URL('../static/images/booster-preview/karina.jpg', import.meta.url)
);
const report = [];

async function trackMotion(page, act, id, motion) {
	await page.evaluate(() => {
		const nodes = [...document.querySelectorAll('.hero-lane .pack-object')];
		const lane = document.querySelector('.hero-lane');
		const origin = lane.getBoundingClientRect().y;
		const baseline = nodes.map((node) => node.getBoundingClientRect());
		window.__carouselTrace = { frames: [], running: true };
		const sample = () => {
			if (!window.__carouselTrace.running) return;
			window.__carouselTrace.frames.push(
				nodes.map((node, i) => {
					const box = node.getBoundingClientRect();
					return {
						x: box.x,
						dy: box.y - lane.getBoundingClientRect().y - (baseline[i].y - origin),
						dh: box.height - baseline[i].height,
						connected: node.isConnected
					};
				})
			);
			requestAnimationFrame(sample);
		};
		requestAnimationFrame(sample);
	});
	await act();
	await page.locator(`.reserve-dock [data-pack-id="${id}"][aria-pressed=true]`).waitFor();
	await page.waitForFunction((id) => {
		const frames = window.__carouselTrace.frames;
		const box = document
			.querySelector(`.pack-slide[data-slide-id="${id}"]`)
			.getBoundingClientRect();
		const lane = document.querySelector('.hero-lane').getBoundingClientRect();
		return (
			Math.abs(box.x + box.width / 2 - lane.x - lane.width / 2) < 0.75 &&
			frames.length >= 35 &&
			frames.slice(-8).every((frame) => Math.abs(frame[0].x - frames.at(-1)[0].x) < 0.25)
		);
	}, id);
	const frames = await page.evaluate(() => {
		window.__carouselTrace.running = false;
		return window.__carouselTrace.frames;
	});
	for (const frame of frames)
		for (const pack of frame) {
			assert.ok(pack.connected, 'each pack retains its original DOM object');
			assert.ok(Math.abs(pack.dy) < 0.75, 'no vertical jump during navigation');
			assert.ok(Math.abs(pack.dh) < 0.75, 'no renderer or size change during navigation');
		}
	if (motion === 'no-preference')
		assert.ok(
			new Set(frames.map((frame) => Math.round(frame[0].x))).size > 5,
			'continuous horizontal movement'
		);
	const centered = await page.locator(`.pack-slide[data-slide-id="${id}"]`).evaluate((node) => {
		const box = node.getBoundingClientRect(),
			lane = node.closest('.hero-lane').getBoundingClientRect();
		return Math.abs(box.x + box.width / 2 - lane.x - lane.width / 2);
	});
	assert.ok(
		centered < 1,
		`selected slide ${id} settles at the center (${centered}px; ${motion}; x ${frames[0][0].x} → ${frames.at(-1)[0].x})`
	);
	return frames.length;
}

for (const [engine, launcher] of [
	['chromium', chromium],
	['webkit', webkit]
]) {
	const browser = await launcher.launch();
	try {
		for (const width of [360, 390, 768, 1024, 1440])
			for (const motion of ['no-preference', 'reduce']) {
				const context = await browser.newContext({
					ignoreHTTPSErrors: true,
					viewport: { width, height: 950 },
					hasTouch: width < 1024,
					reducedMotion: motion
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
				await context.addInitScript(() => {
					localStorage.setItem(
						'encyclomestre.auth-session',
						JSON.stringify({
							accessToken: 'mock',
							user: { id: '1', username: 'Demo', role: 'user' }
						})
					);
					sessionStorage.setItem('wikiforge-plan-scenario', 'opening-fixtures');
					window.__requests = [];
					addEventListener('wikiforge:mock-request', (event) =>
						window.__requests.push(event.detail)
					);
				});
				const page = await context.newPage();
				page.on('pageerror', (error) => errors.push(error.message));
				await page.goto(base + '/boosters');
				await page.getByTestId('booster-open-one').waitFor();
				await page.waitForFunction(
					() => !document.querySelector('[data-testid=booster-open-one]')?.disabled
				);
				await page.locator('[data-testid=pack-carousel][data-ready=true]').waitFor();
				let frames = await trackMotion(
					page,
					() =>
						page
							.locator('.pack-navigation')
							.getByRole('button', { name: 'Pack suivant', exact: true })
							.click(),
					2,
					motion
				);
				frames += await trackMotion(
					page,
					() =>
						page
							.locator('.pack-navigation')
							.getByRole('button', { name: 'Pack précédent', exact: true })
							.click(),
					1,
					motion
				);
				frames += await trackMotion(
					page,
					async () => {
						await page.locator('.reserve-dock [data-pack-id="3"]').focus();
						await page.keyboard.press('Enter');
					},
					3,
					motion
				);
				frames += await trackMotion(
					page,
					() => page.locator('.reserve-dock [data-pack-id="1"]').click(),
					1,
					motion
				);
				if (engine === 'chromium' && width < 768) {
					frames += await trackMotion(
						page,
						async () => {
							await page.locator('.hero-lane').scrollIntoViewIfNeeded();
							const box = await page.locator('.hero-lane').boundingBox();
							const touch = await context.newCDPSession(page);
							const y = box.y + box.height * 0.68,
								x = box.x + box.width * 0.65;
							await touch.send('Input.dispatchTouchEvent', {
								type: 'touchStart',
								touchPoints: [{ x, y }]
							});
							for (let shift = 20; shift <= 160; shift += 20) {
								await touch.send('Input.dispatchTouchEvent', {
									type: 'touchMove',
									touchPoints: [{ x: x - shift, y }]
								});
								await page.waitForTimeout(16);
							}
							await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
							await touch.detach();
						},
						2,
						motion
					);
				}
				assert.equal(
					await page.locator('.hero-lane canvas').count(),
					0,
					'selection does not remount a WebGL scene'
				);
				assert.equal(
					await page.evaluate(() => window.__requests.filter((r) => r.method === 'POST').length),
					0,
					'navigation never opens a booster'
				);
				assert.ok(
					await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
					'no document overflow'
				);
				assert.deepEqual(live, [], 'no production requests');
				assert.deepEqual(errors, [], 'no page errors');
				await page.screenshot({ path: join(output, `${engine}-${width}-${motion}.png`) });
				report.push({ engine, width, motion, frames });
				await context.close();
				console.log(`${engine} ${width} ${motion}: ${frames} stable frames`);
			}
	} finally {
		await browser.close();
	}
}
await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
console.log(`Artifacts: ${output}`);
