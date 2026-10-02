import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.PLAN_TEST_BASE ?? 'https://localhost:5180';
const browser = await chromium.launch();
async function navigate(page, path) {
	await page.evaluate((path) => {
		const a = document.createElement('a');
		a.href = path;
		document.body.append(a);
		a.click();
		a.remove();
	}, path);
	await page.waitForURL((url) => url.pathname === path.split('?')[0]);
}
try {
	for (const width of [360, 390, 768, 1024, 1440]) {
		const context = await browser.newContext({
			ignoreHTTPSErrors: true,
			viewport: { width, height: 950 },
			hasTouch: width <= 768,
			reducedMotion: 'reduce'
		});
		const errors = [],
			live = [];
		await context.route('https://api.wikiforge.fr/**', (route) => {
			live.push(route.request().url());
			return route.abort();
		});
		await context.addInitScript(() => {
			localStorage.setItem(
				'encyclomestre.auth-session',
				JSON.stringify({ accessToken: 'mock', user: { id: '1', username: 'Demo', role: 'user' } })
			);
			window.__planRequests = [];
			addEventListener('wikiforge:mock-request', (e) => window.__planRequests.push(e.detail));
		});
		const page = await context.newPage();
		page.setDefaultTimeout(15000);
		page.on('pageerror', (e) => errors.push(e.message));
		await page.goto(base + '/wishlists');
		await page.getByRole('button', { name: 'Gérer les accès', exact: true }).click();
		let dialog = page.getByRole('dialog');
		await dialog.getByRole('searchbox').fill('TaeyeonFan');
		await dialog.getByRole('button', { name: 'TaeyeonFan', exact: true }).click();
		await dialog.getByRole('button', { name: 'Inviter', exact: true }).click();
		await dialog.getByText('TaeyeonFan', { exact: true }).waitFor();
		await page.keyboard.press('Escape');
		await page.evaluate(() => sessionStorage.setItem('wikiforge-plan-scenario', 'many'));
		await navigate(page, '/trades');
		for (const mode of ['numeric', 'cursor']) {
			await page.getByRole('button', { name: 'Créer un échange', exact: true }).click();
			await page.getByRole('dialog').getByRole('button', { name: 'SoneS9', exact: true }).click();
			dialog = page.getByRole('dialog');
			const selector = dialog.locator('[data-testid=trade-editor-card-selector]');
			const ownPanel = selector.locator(':scope > div').first();
			await ownPanel.locator('[data-testid=card-tile]:visible').first().waitFor();
			await page.evaluate(() => (window.__planRequests = []));
			if (mode === 'cursor') {
				await ownPanel.locator('select:visible').first().selectOption('relevance');
				await page.waitForFunction(() =>
					window.__planRequests.some(
						(r) => r.path.startsWith('/collection?') && r.path.includes('ACQUIRED_DATE')
					)
				);
				await ownPanel.locator('[data-testid=card-tile]:visible').first().waitFor();
			}
			const more = ownPanel
				.getByRole('button', { name: 'Charger la suite', exact: true })
				.filter({ visible: true });
			for (let i = 0; i < 3; i++) {
				const count = await ownPanel.locator('[data-testid=card-tile]:visible').count();
				await more.click();
				await page.waitForFunction(
					(count) =>
						document
							.querySelector('[data-testid=trade-editor-card-selector]')
							?.querySelector('div:not(.hidden)')
							?.querySelectorAll('[data-testid=card-tile]').length > count,
					count
				);
			}
			await more.waitFor({ state: 'hidden' });
			const requests = await page.evaluate(() =>
				window.__planRequests.filter((r) => r.path.startsWith('/collection?')).map((r) => r.path)
			);
			if (mode === 'numeric')
				assert.ok(
					requests.some((path) => new URL(path, 'https://mock').searchParams.get('page') === '1'),
					'Second numeric page'
				);
			else
				assert.ok(
					requests.some((path) => path.includes('cursor=mock-collection-cursor-1')),
					'Second cursor page'
				);
			await page.keyboard.press('Escape');
		}
		await navigate(page, '/collection');
		await navigate(page, '/trades?partner=2&offerCards=90');
		dialog = page.getByRole('dialog');
		await dialog.waitFor();
		await dialog
			.locator(
				'[data-testid=trade-editor-card-selector] > div:not(.hidden) > section > div:first-child button'
			)
			.waitFor();
		assert.ok(
			await page.evaluate(() => window.__planRequests.some((r) => r.path === '/collection/90')),
			'Deep exemplar resolved directly'
		);
		assert.deepEqual(errors, []);
		assert.deepEqual(live, []);
		console.log(
			'Plan trades ' +
				width +
				': named wishlist invitation, numeric and cursor pages, deep exemplar prefill passed'
		);
		await context.close();
	}
} finally {
	await browser.close();
}
