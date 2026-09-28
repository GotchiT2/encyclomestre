import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';

// PUBLIC_API_MOCK_ENABLED=true PUBLIC_API_MOCK_DELAY_MS=10 vite --host 127.0.0.1 --port 5180
const base = process.argv[2] ?? 'https://127.0.0.1:5180';
const output = join(tmpdir(), 'wikiforge-auctions');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
	ignoreHTTPSErrors: true,
	viewport: { width: 1440, height: 1000 },
	reducedMotion: 'reduce'
});
const page = await context.newPage();
const errors = [];
const liveRequests = [];
page.on('pageerror', (error) => errors.push(error.message));
await context.route('https://api.wikiforge.fr/**', (route) => {
	liveRequests.push(route.request().method() + ' ' + route.request().url());
	return route.abort();
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
	window.addEventListener('wikiforge:mock-auction-request', (event) =>
		window.__auctionRequests.push(event.detail)
	);
});
const counts = () => page.evaluate(() => window.__auctionRequests);
const requestCount = async (path, method) =>
	(await counts()).filter((entry) => entry.path === path && entry.method === method).length;
const scenario = (value) =>
	page.evaluate(
		(value) =>
			value
				? sessionStorage.setItem('wikiforge-auction-scenario', value)
				: sessionStorage.removeItem('wikiforge-auction-scenario'),
		value
	);
const checkWidth = async () =>
	assert.ok(
		await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
		'No horizontal overflow'
	);
const confirm = async () => {
	await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
	await page.getByRole('dialog').waitFor({ state: 'hidden' });
};
try {
	await page.goto(base + '/market');
	await page.locator('[data-auction-id="70"]').waitFor();
	assert.ok((await counts()).length, 'Mock transport must be active before any mutation');
	await page.getByRole('button', { name: 'Suivant', exact: true }).click();
	await page.waitForURL(/page=1/);
	await page.locator('[data-auction-id]').first().waitFor();
	await page.getByRole('button', { name: 'Précédent', exact: true }).click();
	await page.locator('summary').filter({ hasText: 'Filtres' }).click();
	await page.getByLabel('Titre de la carte').fill('AUCUNE-CARTE-ICI');
	await page.getByRole('button', { name: 'Appliquer les filtres' }).click();
	await page.getByText('Aucune enchère dans cette vue.').waitFor();
	await page.getByRole('button', { name: 'Effacer les filtres' }).click();
	await page.locator('[data-auction-id="70"]').waitFor();
	await page.getByRole('button', { name: 'Mes participations', exact: true }).click();
	await page.locator('[data-auction-id="73"]').waitFor();
	await page.locator('[data-auction-id="74"]').waitFor();
	await page.getByRole('button', { name: 'Historique', exact: true }).click();
	await page.locator('[data-auction-id="75"]').waitFor();
	await page.getByLabel('Historique de').selectOption('sales');
 await page.locator('[data-auction-id="76"]').waitFor();
	await page.getByRole('button', { name: 'Mes ventes', exact: true }).click();
	await page.locator('[data-auction-id="71"] a').first().click();
	await page.getByRole('heading', { name: 'Gérer ma vente' }).waitFor();
	await page.getByLabel('Modifier le prix de départ').fill('250');
	await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
	await confirm();
	assert.equal(await requestCount('/me/auctions/71', 'PATCH'), 1);
	await page.getByRole('button', { name: 'Annuler mon enchère' }).click();
	await confirm();
	await page.getByText('Annulée', { exact: true }).first().waitFor();
	await page.getByRole('link', { name: 'Retour aux enchères' }).click();
	await page.waitForURL(/tab=sales/);
	assert.equal(await page.locator('[data-auction-id="71"]').count(), 0);

	await page.goto(base + '/market/70');
	await page.getByLabel('Votre maximum', { exact: true }).waitFor();
	await page.waitForTimeout(400);
	assert.equal(await requestCount('/auctions/70', 'GET'), 1);
	assert.equal(await requestCount('/auctions/70/watch', 'PUT'), 1);
	await page.getByLabel('Votre maximum', { exact: true }).fill('500');
	await page.evaluate(() => {
		for (let i = 0; i < 20; i++)
			window.dispatchEvent(new CustomEvent('wikiforge:auction-updated', { detail: { id: 70 } }));
	});
	await page.waitForTimeout(500);
	assert.equal(await requestCount('/auctions/70', 'GET'), 2);
	assert.equal(await requestCount('/auctions/70/watch', 'PUT'), 1);
	assert.equal(await page.getByLabel('Votre maximum', { exact: true }).inputValue(), '500');
	await page.getByRole('button', { name: 'Confirmer mon maximum', exact: true }).click();
	await confirm();
	assert.equal(await requestCount('/auctions/70/bids', 'POST'), 1);
	await page.getByLabel('Votre maximum', { exact: true }).fill('600');
	await scenario('conflict');
	await page.getByRole('button', { name: 'Relever mon maximum', exact: true }).click();
	await confirm();
	await page.getByRole('alert').filter({ hasText: 'Votre saisie est conservée' }).waitFor();
	assert.equal(await page.getByLabel('Votre maximum', { exact: true }).inputValue(), '600');
	await scenario(null);
	await page.getByRole('button', { name: 'Détail de la carte', exact: true }).click();
	await page.getByRole('dialog').waitFor();
	assert.ok(await page.getByRole('dialog').getByText('Attaque', { exact: true }).isVisible());
	await page.keyboard.press('Escape');
	await page.getByRole('dialog').waitFor({ state: 'hidden' });
	await page.getByRole('button', { name: 'Signaler · Carte', exact: true }).click();
	await page.getByLabel('Commentaire facultatif', { exact: true }).fill('Image à vérifier.');
	await page.evaluate(() => sessionStorage.setItem('wikiforge-community-scenario', 'conflict'));
	await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
	await page.getByRole('dialog').getByRole('alert').waitFor();
	assert.equal(
		await page.getByLabel('Commentaire facultatif', { exact: true }).inputValue(),
		'Image à vérifier.'
	);
	await page.evaluate(() => sessionStorage.removeItem('wikiforge-community-scenario'));
	await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
	await page.getByRole('dialog').waitFor({ state: 'hidden' });

	for (const width of [360, 390, 768, 1024, 1440]) {
		await page.setViewportSize({ width, height: 1000 });
		await checkWidth();
		await page.screenshot({ path: join(output, 'detail-' + width + '.png'), fullPage: true });
		await page.getByRole('link', { name: 'Retour aux enchères' }).click();
		await page.locator('[data-auction-id="70"]').waitFor();
		await checkWidth();
		await page.keyboard.press('Tab');
		assert.ok(await page.evaluate(() => document.activeElement !== document.body));
		await page.screenshot({ path: join(output, 'catalogue-' + width + '.png'), fullPage: true });
		await page.locator('[data-auction-id="70"] a').first().click();
		await page.getByLabel('Votre maximum', { exact: true }).waitFor();
	}
	await page.goto(base + '/market/999999');
	await page.getByRole('alert').filter({ hasText: 'introuvable' }).waitFor();
	await page.goto(base + '/market/70');
	await page.getByLabel('Votre maximum', { exact: true }).waitFor();
	await scenario('read-error');
	await page.getByRole('button', { name: 'Actualiser', exact: true }).click();
	await page.getByRole('alert').filter({ hasText: 'Impossible de charger' }).waitFor();
	await scenario(null);
	await page.getByRole('button', { name: 'Réessayer', exact: true }).click();
	await page.getByRole('alert').waitFor({ state: 'hidden' });
	await page.goto(base + '/collection');
	await page.locator('[data-testid="card-active-auction"]').first().waitFor();
	await page
		.locator('[data-testid="card-tile"]')
		.filter({ has: page.locator('[data-testid="card-active-auction"]') })
		.first()
		.getByRole('button')
		.first()
		.press('Enter');
	await page.getByRole('dialog').getByRole('link', { name: 'Voir l’enchère' }).waitFor();
	await page.keyboard.press('Escape');
	await page.locator('[data-testid="card-detail-modal"]').waitFor({ state: 'hidden' });
	const eligible = page
		.locator(
			'[data-testid="card-tile"]:not(:has([data-testid="card-protected-indicator"])):not(:has([data-testid="card-active-sale"])):not(:has([data-testid="card-active-auction"]))'
		)
		.first();
	await eligible.getByRole('button').first().press('Enter');
	const cardDialog = page.getByRole('dialog');
	await cardDialog.getByLabel('Prix de départ', { exact: true }).fill('200');
	const localEnd = await page.evaluate(() =>
		new Date(Date.now() + 3_600_000 - new Date().getTimezoneOffset() * 60_000)
			.toISOString()
			.slice(0, 16)
	);
	await cardDialog.getByLabel('Fin', { exact: true }).fill(localEnd);
	await cardDialog.locator('form button[type="submit"]').click();
	await page
		.getByRole('dialog', { name: 'Confirmer la mise en vente' })
		.getByRole('button', { name: 'Confirmer', exact: true })
		.click();
	await cardDialog.getByRole('link', { name: 'Voir l’enchère' }).waitFor();
	assert.equal(await requestCount('/me/auctions', 'POST'), 1);
	assert.deepEqual(errors, []);
	assert.deepEqual(liveRequests, [], 'No live API calls are allowed');
	console.log('Auction flows passed at five widths. Screenshots: ' + output);
} catch (error) {
	console.log(
		await page.evaluate(() => ({
			url: location.href,
			scroll: scrollY,
			inner: [innerWidth, innerHeight],
			body: [document.body.scrollHeight, document.body.scrollWidth],
			root: [document.documentElement.scrollHeight, document.documentElement.scrollWidth],
			overflow: getComputedStyle(document.body).overflow,
			next: [...document.querySelectorAll('button')]
				.filter((button) => button.textContent.includes('Suivant'))
				.map((button) => {
					const r = button.getBoundingClientRect();
					return { x: r.x, y: r.y, w: r.width, h: r.height };
				})
		}))
	);
	await page.screenshot({ path: join(output, 'failure.png'), fullPage: true });
	throw error;
} finally {
	await browser.close();
}
