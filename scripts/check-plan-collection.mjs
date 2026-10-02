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
		page.on('pageerror', (error) => errors.push(error.message));
		await page.goto(base + '/collection');
		await page.locator('[data-testid=card-tile]').first().waitFor();
		const actions = page.getByTestId('card-quick-actions');
		let target;
		for (const button of await actions.all()) {
			await button.click();
			const protect = page.getByRole('menuitem', { name: 'Protéger', exact: true });
			if ((await protect.count()) && (await protect.isEnabled())) {
				target = button;
				break;
			}
			await page.keyboard.press('Escape');
		}
		assert.ok(target, 'An available exemplar can be protected');
		await page.getByRole('menuitem', { name: 'Protéger', exact: true }).click();
		await target.click();
		await page.getByRole('menuitem', { name: 'Retirer la protection', exact: true }).click();
		await target.click();
		await page.getByRole('menuitem', { name: 'À vendre', exact: true }).click();
		const dialog = page.getByRole('dialog');
		await dialog.getByLabel('Prix', { exact: true }).fill('123');
		await page.evaluate(() => {
			sessionStorage.setItem('wikiforge-plan-scenario', 'conflict');
			sessionStorage.setItem('wikiforge-plan-path', '/me/sales');
		});
		await dialog.getByRole('button', { name: 'Mettre en vente', exact: true }).click();
		await dialog.getByRole('alert').waitFor();
		assert.equal(await dialog.getByLabel('Prix', { exact: true }).inputValue(), '123');
		await page.evaluate(() => {
			sessionStorage.removeItem('wikiforge-plan-scenario');
			sessionStorage.removeItem('wikiforge-plan-path');
		});
		await dialog.getByRole('button', { name: 'Mettre en vente', exact: true }).click();
		await dialog
			.getByText('Cet exemplaire est en vente sur votre profil.', { exact: true })
			.waitFor();
		await page.keyboard.press('Escape');
		await navigate(page, '/friends');
		const requests = page.locator('.requests-toggle');
		if (await requests.isVisible()) await requests.click();
		await page.getByRole('button', { name: 'Accepter', exact: true }).first().click();
		await page.getByText('Demandes reçues', { exact: true }).waitFor({ state: 'hidden' });
		await navigate(page, '/messages?user=3');
		const composer = page.locator('textarea:visible');
		await composer.waitFor();
		await composer.fill('Premier message ' + width);
		await page.evaluate(() => {
			sessionStorage.setItem('wikiforge-plan-scenario', 'conflict');
			sessionStorage.setItem('wikiforge-plan-path', '/conversations/3/messages');
		});
		await page
			.getByRole('button', { name: 'Envoyer', exact: true })
			.filter({ visible: true })
			.click();
		await page.getByRole('alert').waitFor();
		assert.equal(await composer.inputValue(), 'Premier message ' + width);
		await page.evaluate(() => {
			sessionStorage.removeItem('wikiforge-plan-scenario');
			sessionStorage.removeItem('wikiforge-plan-path');
		});
		await page
			.getByRole('button', { name: 'Envoyer', exact: true })
			.filter({ visible: true })
			.click();
		await page
			.getByText('Premier message ' + width, { exact: true })
			.filter({ visible: true })
			.waitFor();
		assert.equal(await composer.inputValue(), '');
		await page.keyboard.press('Escape');
		await navigate(page, '/collection');
		await navigate(page, '/messages?user=3');
		await page.waitForTimeout(250);
		assert.equal(
			await page
				.locator('[data-testid=message-scroll-area]:visible')
				.getByText('Premier message ' + width, { exact: true })
				.count(),
			1,
			'No duplicate after resync'
		);
		await navigate(page, '/collection');
		await page.evaluate(() => sessionStorage.setItem('wikiforge-plan-scenario', 'many'));
		await page.reload();
		await page.locator('[data-testid=card-tile]').nth(47).waitFor();
		const more = page.getByRole('button', { name: 'Charger la suite', exact: true });
		for (const count of [96, 144, 145]) {
			await more.click();
			await page.waitForFunction(
				(count) => document.querySelectorAll('[data-testid=card-tile]').length === count,
				count
			);
		}
		await more.waitFor({ state: 'hidden' });
		await page.evaluate(() => sessionStorage.setItem('wikiforge-plan-scenario', 'error'));
		await page.reload();
		await page.getByText('La collection est indisponible.', { exact: true }).waitFor();
		await page.evaluate(() => sessionStorage.setItem('wikiforge-plan-scenario', 'empty'));
		await page.getByRole('button', { name: 'Réessayer', exact: true }).click();
		await page.getByText('Vous ne possédez aucune carte.', { exact: true }).waitFor();
		assert.deepEqual(errors, []);
		assert.deepEqual(live, []);
		await context.close();
		console.log(
			'Protection, sales, first message, resync, paging and error recovery passed at ' +
				width +
				'px'
		);
	}
} finally {
	await browser.close();
}
