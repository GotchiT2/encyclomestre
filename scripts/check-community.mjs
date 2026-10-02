import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'https://127.0.0.1:5180';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ignoreHTTPSErrors: true, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [],
	live = [];
page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
await context.route('https://api.wikiforge.fr/**', (route) => {
	live.push(route.request().url());
	return route.abort();
});
await context.addInitScript(() =>
	localStorage.setItem(
		'encyclomestre.auth-session',
		JSON.stringify({
			accessToken: 'mock-only',
			user: { id: '1', username: 'Demo', displayName: 'Demo', money: 10000, role: 'user' }
		})
	)
);
const scenario = (value) =>
	page.evaluate(
		(value) =>
			value
				? sessionStorage.setItem('wikiforge-community-scenario', value)
				: sessionStorage.removeItem('wikiforge-community-scenario'),
		value
	);
const confirm = async () => {
	await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
	await page.getByRole('dialog').waitFor({ state: 'hidden' });
};
try {
	await page.goto(base + '/guild');
	await page.getByRole('link', { name: /Les archivistes/ }).waitFor();
	await page.getByRole('link', { name: /Les archivistes/ }).click();
	await page.getByRole('link', { name: 'Gestion', exact: true }).click();
	await page.getByLabel('Nom', { exact: true }).fill('Les archivistes rénovés');
	await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
	await page.getByRole('heading', { name: 'Les archivistes rénovés', exact: true }).waitFor();
	await page.getByRole('link', { name: 'Discussion', exact: true }).click();
	await page.getByLabel('Votre message', { exact: true }).fill('Message clavier');
	await page.getByLabel('Votre message', { exact: true }).press('Tab');
	await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
	await page.getByText('Message clavier', { exact: true }).waitFor();
	await page.getByRole('button', { name: 'Signaler · Message de guilde', exact: true }).click();
	await page.getByLabel('Commentaire facultatif', { exact: true }).fill('Brouillon conservé');
	await scenario('conflict');
	await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
	await page.getByRole('dialog').getByRole('alert').waitFor();
	assert.equal(
		await page.getByLabel('Commentaire facultatif', { exact: true }).inputValue(),
		'Brouillon conservé'
	);
	await scenario(null);
	await confirm();
	await page.goto(base + '/moderation/1');
	await page.getByRole('heading', { name: 'Échange avec la modération' }).waitFor();
	await page.getByLabel('Répondre à la modération', { exact: true }).fill('Réponse du joueur');
	await scenario('conflict');
	await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
	await page.getByRole('alert').waitFor();
	assert.equal(
		await page.getByLabel('Répondre à la modération', { exact: true }).inputValue(),
		'Réponse du joueur'
	);
	await scenario('mute');
	await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
	await page.getByText('Réponse du joueur', { exact: true }).waitFor();
	await scenario(null);
	await page.goto(base + '/guilds/1?tab=members');
	await page.getByRole('button', { name: 'Droits', exact: true }).click();
	await page.getByLabel('Inviter', { exact: true }).check();
	await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
	await confirm();
	await page.getByRole('button', { name: 'Transmettre la propriété', exact: true }).click();
	await confirm();
	await page.getByRole('link', { name: 'Présentation', exact: true }).click();
	await page.getByRole('button', { name: 'Quitter la guilde', exact: true }).click();
	await confirm();
	await page.getByRole('button', { name: 'Créer une guilde', exact: true }).click();
	await page.getByLabel('Nom', { exact: true }).fill('Guilde de validation');
	await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
	await page.getByRole('heading', { name: 'Guilde de validation', exact: true }).waitFor();
	await page.getByRole('link', { name: 'Présentation', exact: true }).click();
	await page.getByRole('button', { name: 'Dissoudre la guilde', exact: true }).click();
	await confirm();
	await page.getByRole('button', { name: 'Rechercher une guilde', exact: true }).click();
	await page
		.getByRole('textbox', { name: 'Rechercher une guilde', exact: true })
		.fill('explorateurs');
	await page.getByRole('button', { name: 'Rechercher une guilde', exact: true }).last().click();
	await page.getByRole('link', { name: /Les explorateurs/ }).click();
	await page.getByRole('button', { name: 'Rejoindre', exact: true }).click();
	await confirm();
	await page.getByRole('link', { name: 'Wishlists partagées', exact: true }).click();
	await page.getByRole('button', { name: /Cartes recherchées/ }).click();
	await page.locator('[data-testid="card-tile"]').first().waitFor();
	for (const width of [360, 390, 768, 1024, 1440]) {
		await page.setViewportSize({ width, height: 1000 });
		for (const path of [
			'/guild',
			'/guilds/1?tab=members',
			'/guilds/1?tab=manage',
			'/guilds/1?tab=chat',
			'/moderation',
			'/moderation/1',
			'/cards/1',
			'/packs/1'
		]) {
			await page.goto(base + path);
			await page.waitForTimeout(250);
			assert.ok(
				await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
				width + ' ' + path + ' overflow'
			);
		}
	}
	assert.deepEqual(errors, []);
	assert.deepEqual(live, []);
	console.log('Community flows passed, five widths; no production API calls.');
} finally {
	await browser.close();
}
