import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.ARCADE_TEST_BASE ?? 'https://dev.wikiforge.fr';
const widths = (process.env.ARCADE_TEST_WIDTHS ?? '360,390,768,1024,1440').split(',').map(Number);
const browser = await chromium.launch();
async function player(width) {
	const context = await browser.newContext({
		ignoreHTTPSErrors: true,
		viewport: { width, height: 950 },
		reducedMotion: 'reduce',
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
		window.__arcadeRequests = [];
		addEventListener('wikiforge:mock-request', (event) =>
			window.__arcadeRequests.push(event.detail)
		);
	});
	const page = await context.newPage();
	page.setDefaultTimeout(15000);
	return { context, page };
}
const opens = (page) =>
	page.evaluate(
		() =>
			window.__arcadeRequests.filter(
				(item) => item.method === 'POST' && /\/boosters\/\d+\/open/.test(item.path)
			).length
	);
try {
	for (const width of widths) {
		let { context, page } = await player(width);
		await page.goto(base + '/boosters', { waitUntil: 'domcontentloaded' });
		await page.getByTestId('booster-open-one').click();
		let dialog = page.getByRole('dialog');
		await dialog.getByRole('button', { name: 'Carte suivante', exact: true }).click();
		await dialog.getByRole('button', { name: 'Carte suivante', exact: true }).click();
		const saved = await page.evaluate(() =>
			JSON.parse(sessionStorage.getItem('encyclomestre.arcade.opening.1'))
		);
		assert.equal(saved.revealed, 2);
		assert.equal(await opens(page), 1);
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.getByRole('button', { name: 'Reprendre la découverte', exact: true }).click();
		dialog = page.getByRole('dialog');
		await dialog.getByText('2 / 5 cartes révélées', { exact: true }).waitFor();
		assert.equal(await opens(page), 0, 'Resume must only read cards');
		await dialog.getByRole('button', { name: 'Tout révéler', exact: true }).click();
		await dialog.getByRole('button', { name: 'Quitter', exact: true }).click();
		await page.getByRole('button', { name: 'Express', exact: true }).click();
		await page.getByTestId('booster-open-one').click();
		dialog = page.getByRole('dialog');
		await dialog.getByText('Les cartes sont dans votre collection', { exact: true }).waitFor();
		assert.equal(
			await dialog.getByRole('button', { name: 'Carte suivante', exact: true }).count(),
			0
		);
		await dialog.getByRole('button', { name: 'Quitter', exact: true }).click();
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.getByRole('button', { name: 'Express', exact: true }).waitFor();
		assert.equal(
			await page.getByRole('button', { name: 'Express', exact: true }).getAttribute('aria-pressed'),
			'true'
		);
		await page.goto(base + '/settings', { waitUntil: 'domcontentloaded' });
		await page.getByRole('button', { name: 'Déconnexion', exact: true }).last().click();
		await page.waitForFunction(() => !localStorage.getItem('encyclomestre.auth-session'));
		assert.equal(
			await page.evaluate(
				() =>
					Object.keys(sessionStorage).filter((key) =>
						key.startsWith('encyclomestre.arcade.opening.')
					).length
			),
			0
		);
		await context.close();

		({ context, page } = await player(width));
		await page.goto(base + '/boosters', { waitUntil: 'domcontentloaded' });
		await page.getByTestId('booster-open-one').waitFor();
		await page.evaluate(() => sessionStorage.setItem('wikiforge-plan-scenario', 'stock-limited'));
		await page.getByRole('button', { name: 'Ouvrir le lot disponible', exact: true }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
		dialog = page.getByRole('dialog');
		await dialog.getByRole('button', { name: 'Tout révéler', exact: true }).click();
		await dialog.getByText(/2 boosters ouverts/).waitFor();
		assert.equal(
			await dialog.getByTestId('card-tile').count(),
			10,
			'Actual stock limits the batch'
		);
		assert.equal(await opens(page), 1, 'One batch ceremony and one write');
		await dialog.getByRole('button', { name: 'Quitter', exact: true }).click();
		assert.equal(await page.getByTestId('booster-open-one').isDisabled(), true);
		await context.close();

		({ context, page } = await player(width));
		await page.goto(base + '/boosters', { waitUntil: 'domcontentloaded' });
		await page.getByTestId('booster-open-one').waitFor();
		await page.evaluate(() =>
			sessionStorage.setItem('wikiforge-plan-scenario', 'uncertain-opening')
		);
		await page.getByTestId('booster-open-one').click();
		await page.getByText(/Le résultat de cette ouverture n’a pas pu être confirmé/).waitFor();
		assert.equal(await opens(page), 1, 'Uncertain writes must never retry');
		assert.equal(await page.getByRole('dialog').count(), 0, 'No fictional result');
		assert.equal(
			await page.evaluate(() => sessionStorage.getItem('encyclomestre.arcade.opening.1')),
			null
		);
		await page.goto(base + '/collection', { waitUntil: 'domcontentloaded' });
		await page.locator('[data-testid=card-tile]').first().waitFor();
		assert.ok(
			(await page.locator('[data-testid=card-tile]').count()) >= 20,
			'Acquisitions remain accessible after a lost response'
		);
		await context.close();
		console.log('Resume, Express, logout, stock and uncertain opening: ' + width + 'px');
	}
} finally {
	await browser.close();
}
