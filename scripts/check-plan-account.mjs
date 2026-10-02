import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.PLAN_TEST_BASE ?? 'https://localhost:5180';
const browser = await chromium.launch();
const widths = (process.env.PLAN_TEST_WIDTHS ?? '360,390,768,1024,1440').split(',').map(Number);
async function navigate(page, path) {
	await page.evaluate((path) => {
		const link = document.createElement('a');
		link.href = path;
		document.body.append(link);
		link.click();
		link.remove();
	}, path);
	await page.waitForURL((url) => url.pathname === path.split('?')[0]);
}
async function acknowledge(page) {
	const codes = (await page.getByRole('dialog').count())
		? await page.getByRole('dialog').locator('ul li').allTextContents()
		: await page.locator('ul li').allTextContents();
	await page.getByLabel('J’ai conservé mes codes dans un endroit sûr.').check();
	await page.getByRole('button', { name: 'Entrer dans le jeu', exact: true }).click();
	return codes;
}
try {
	for (const width of widths) {
		const context = await browser.newContext({
			ignoreHTTPSErrors: true,
			viewport: { width, height: 950 },
			hasTouch: width < 768
		});
		const external = [],
			errors = [];
		await context.route('https://api.wikiforge.fr/**', (route) => {
			external.push(route.request().url());
			return route.abort();
		});
		const page = await context.newPage();
		page.setDefaultTimeout(15000);
		page.on('pageerror', (e) => errors.push(e.message));
		const cdp = await context.newCDPSession(page);
		await cdp.send('WebAuthn.enable');
		let authenticator;
		async function newDevice() {
			if (authenticator)
				await cdp.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId: authenticator });
			authenticator = (
				await cdp.send('WebAuthn.addVirtualAuthenticator', {
					options: {
						protocol: 'ctap2',
						transport: 'internal',
						hasResidentKey: true,
						hasUserVerification: true,
						isUserVerified: true,
						automaticPresenceSimulation: true
					}
				})
			).authenticatorId;
		}
		await newDevice();
		await page.goto(base + '/register');
		await page.getByLabel('Pseudonyme', { exact: true }).fill('Account' + width);
		await page.getByRole('button', { name: 'Créer une passkey', exact: true }).click();
		await page.getByRole('heading', { name: 'Codes de secours', exact: true }).waitFor();
		let codes = await page.locator('ul li').allTextContents();
		assert.equal(codes.length, 10);
		await acknowledge(page);
		await page.waitForURL(base + '/collection');
		await navigate(page, '/settings');
		await page.getByRole('button', { name: 'Ajouter une passkey', exact: true }).click();
		const dialog = page.getByRole('dialog');
		await dialog.getByLabel('Nom de la passkey').fill('Second appareil');
		await dialog.getByLabel('Utiliser un code de secours', { exact: true }).check();
		await dialog.getByLabel('Code de secours', { exact: true }).fill(codes[0]);
		await newDevice();
		await dialog.getByRole('button', { name: 'Ajouter une passkey', exact: true }).click();
		await page.getByText('Passkey enregistrée.', { exact: true }).waitFor();
		await page.getByText('9 codes de secours restants', { exact: true }).waitFor();
		await page.getByRole('button', { name: 'Générer de nouveaux codes', exact: true }).click();
		await page
			.getByRole('dialog')
			.getByRole('button', { name: 'Générer de nouveaux codes', exact: true })
			.click();
		await page.getByLabel('J’ai conservé mes codes dans un endroit sûr.').waitFor();
		codes = await page.getByRole('dialog').locator('ul li').allTextContents();
		assert.equal(codes.length, 10);
		await acknowledge(page);
		const persisted = await page.evaluate(() =>
			JSON.stringify({ local: localStorage, session: sessionStorage })
		);
		assert.ok(codes.every((code) => !persisted.includes(code)));
		await page.getByRole('button', { name: 'Déconnexion', exact: true }).last().click();
		await page.waitForFunction(() => !localStorage.getItem('encyclomestre.auth-session'));
		await navigate(page, '/recovery');
		await page.getByLabel('Pseudonyme', { exact: true }).fill('Account' + width);
		await page.getByLabel('Code de secours', { exact: true }).fill('invalid-code');
		await page.getByRole('button', { name: 'Créer une passkey', exact: true }).click();
		await page.getByRole('alert').waitFor();
		await page.getByLabel('Code de secours', { exact: true }).fill(codes[0]);
		await newDevice();
		await page.getByRole('button', { name: 'Créer une passkey', exact: true }).click();
		await page.waitForURL(base + '/collection');
		await navigate(page, '/settings');
		await page.getByText('9 codes de secours restants', { exact: true }).waitFor();
		await page.getByRole('button', { name: 'Déconnexion', exact: true }).last().click();
		await page.waitForFunction(() => !localStorage.getItem('encyclomestre.auth-session'));
		await navigate(page, '/recovery?token=mock-recovery-link');
		await page.getByText(/Ce lien remplace vos anciennes passkeys/).waitFor();
		await newDevice();
		await page.getByRole('button', { name: 'Créer une passkey', exact: true }).click();
		await page.getByLabel('J’ai conservé mes codes dans un endroit sûr.').waitFor();
		codes = await page.locator('ul li').allTextContents();
		await acknowledge(page);
		await page.waitForURL(base + '/collection');
		await navigate(page, '/settings');
		await page.getByRole('button', { name: 'Supprimer', exact: true }).first().waitFor();
		assert.equal(
			await page.getByRole('button', { name: 'Supprimer', exact: true }).count(),
			1,
			'Link replaces old passkeys'
		);
		await page.getByRole('button', { name: 'Déconnexion', exact: true }).last().click();
		await page.waitForFunction(() => !localStorage.getItem('encyclomestre.auth-session'));
		await navigate(page, '/login?redirectTo=/settings');
		await page.getByRole('button', { name: 'Se connecter avec une passkey', exact: true }).click();
		await page.waitForURL(base + '/settings');
		await page.getByRole('button', { name: 'Voir les conséquences', exact: true }).click();
		await page.getByLabel('Utiliser un code de secours', { exact: true }).check();
		await page.getByLabel('Code de secours', { exact: true }).fill(codes[0]);
		await page.getByRole('checkbox', { name: /fermeture définitive/ }).check();
		await page.getByRole('button', { name: 'Supprimer mon compte', exact: true }).click();
		await page
			.getByText('Votre compte a été fermé et vos sessions révoquées.', { exact: true })
			.waitFor();
		assert.equal(
			await page.evaluate(() => localStorage.getItem('encyclomestre.auth-session')),
			null
		);
		assert.deepEqual(errors, []);
		assert.deepEqual(external, []);
		await context.close();
		console.log(
			'Passkeys, recovery, codes, redirect and account closure passed at ' + width + 'px'
		);
	}
} finally {
	await browser.close();
}
