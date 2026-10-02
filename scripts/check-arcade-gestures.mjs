import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.ARCADE_TEST_BASE ?? 'https://dev.wikiforge.fr';
const browser = await chromium.launch();
try {
	for (const width of [360, 390, 768, 1024, 1440]) {
		const context = await browser.newContext({
			viewport: { width, height: 950 },
			ignoreHTTPSErrors: true,
			reducedMotion: 'no-preference',
			hasTouch: width <= 768
		});
		await context.route('https://api.wikiforge.fr/**', (route) => {
			throw new Error('Live API forbidden: ' + route.request().url());
		});
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
		const errors = [];
		page.on('pageerror', (error) => errors.push(error.message));
		await page.goto(base + '/boosters');
		const pack = page.locator('.gallery-pack.selected');
		await pack.waitFor();
		await pack.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 100, clientY: 300 });
		await pack.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 190, clientY: 300 });
		assert.equal(
			await page.evaluate(() => window.__opens),
			0,
			'Gallery swipes never consume a credit'
		);
		const strip = page.getByTestId('pack-tear-handle');
		await strip.scrollIntoViewIfNeeded();
		const box = await strip.boundingBox();
		await page.mouse.move(box.x + 25, box.y + 20);
		await page.mouse.down();
		await page.mouse.move(box.x + 120, box.y + 20, { steps: 8 });
		await page.mouse.up();
		const dialog = page.getByRole('dialog');
		await dialog.getByRole('button', { name: 'Carte suivante', exact: true }).waitFor();
		assert.equal(await page.evaluate(() => window.__opens), 1);
		await dialog.getByRole('button', { name: 'Carte suivante', exact: true }).click();
		await dialog.getByText('1 / 5 cartes révélées', { exact: true }).waitFor();
		await dialog.getByRole('button', { name: 'Tout révéler', exact: true }).click();
		await dialog.getByText('Les cartes sont dans votre collection', { exact: true }).waitFor();
		assert.deepEqual(errors, []);
		await context.close();
		console.log('Dedicated tear gesture and regular motion: ' + width + 'px');
	}
} finally {
	await browser.close();
}
