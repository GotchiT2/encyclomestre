import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
const browser = await chromium.launch();
const folder = join(tmpdir(), 'wikiforge-passkeys');
await mkdir(folder, { recursive: true });
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
	for (const app of process.argv[2] ? [process.argv[2]] : ['fo', 'bo'])
		for (const width of [360, 390, 768, 1024, 1440]) {
			const context = await browser.newContext({
				ignoreHTTPSErrors: true,
				viewport: { width, height: 950 },
				reducedMotion: 'reduce'
			});
			const failures = [],
				external = [];
			await context.route('https://api.wikiforge.fr/**', (route) => {
				external.push(route.request().url());
				return route.abort();
			});
			await context.addInitScript(
				({ app }) => {
					window.turnstile = {
						render: () => 'mock-widget',
						execute: () => {},
						reset: () => {},
						remove: () => {}
					};
					localStorage.setItem(
						app === 'fo' ? 'encyclomestre.auth-session' : 'wikiforge-bo-session',
						JSON.stringify(
							app === 'fo'
								? {
										accessToken: 'mock',
										user: { id: '1', username: 'Demo', displayName: 'Demo', role: 'user' }
									}
								: { accessToken: 'mock', user: { id: 1, name: 'Admin', roles: ['ADMIN'] } }
						)
					);
				},
				{ app }
			);
			const page = await context.newPage();
			page.setDefaultTimeout(15000);
			page.on('pageerror', (e) => failures.push(e.message));
			const cdp = await context.newCDPSession(page);
			await cdp.send('WebAuthn.enable');
			const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
				options: {
					protocol: 'ctap2',
					transport: 'internal',
					hasResidentKey: true,
					hasUserVerification: true,
					isUserVerified: true,
					automaticPresenceSimulation: true
				}
			});
			const base = app === 'fo' ? 'https://localhost:5180' : 'https://localhost:5181',
				settings = app === 'fo' ? '/settings' : '/security';
			await page.goto(base + settings);
			await page.getByRole('button', { name: 'Ajouter une passkey', exact: true }).click();
			const dialog = page.getByRole('dialog');
			await page.keyboard.press('Tab');
			await page.keyboard.press('Shift+Tab');
			assert.equal(await dialog.evaluate((el) => el.contains(document.activeElement)), true);
			await dialog.getByLabel('Nom de la passkey').fill('Mon appareil');
			await dialog.getByLabel('Mot de passe actuel').fill('wrong');
			await dialog.getByRole('button', { name: 'Ajouter une passkey', exact: true }).click();
			try {
				await dialog
					.getByRole('alert')
					.getByText(/Mot de passe incorrect/)
					.waitFor();
			} catch (e) {
				console.log('DEBUG', await dialog.innerText(), failures);
				await page.screenshot({ path: join(folder, 'failure.png') });
				throw e;
			}
			assert.equal(
				(await cdp.send('WebAuthn.getCredentials', { authenticatorId })).credentials.length,
				1
			);
			await page.screenshot({ path: join(folder, `${app}-dialog-${width}.png`) });
			await dialog.getByLabel('Mot de passe actuel').fill('demo-password');
			await dialog.getByRole('button', { name: 'Ajouter une passkey', exact: true }).click();
			await page.getByText('Passkey enregistrée.', { exact: true }).waitFor();
			assert.equal(
				(await cdp.send('WebAuthn.getCredentials', { authenticatorId })).credentials.length,
				1
			);
			await page.getByText('Mon appareil', { exact: true }).waitFor();
			assert.equal(
				await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
				true
			);
			if (app === 'bo' && width < 768)
				await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
			await page.getByRole('button', { name: 'Déconnexion', exact: true }).last().click();
			if (app === 'fo') await navigate(page, '/login?redirectTo=/settings');
			else await page.waitForURL('**/login');
			await page
				.getByRole('button', { name: 'Se connecter avec une passkey', exact: true })
				.click();
			await page.waitForURL((url) => url.pathname === (app === 'fo' ? '/settings' : '/packs'));
			if (app === 'bo') await navigate(page, '/security');
			assert.equal(
				(await cdp.send('WebAuthn.getCredentials', { authenticatorId })).credentials.length,
				1
			);
			await page.getByText('Mon appareil', { exact: true }).waitFor();
			await page.getByRole('heading', { name: 'Passkeys', exact: true }).scrollIntoViewIfNeeded();
			await page.screenshot({ path: join(folder, `${app}-${width}.png`) });
			await page.getByRole('button', { name: 'Supprimer', exact: true }).click();
			await page
				.getByRole('dialog')
				.getByRole('button', { name: 'Supprimer', exact: true })
				.click();
			await page.getByText('Passkey supprimée.', { exact: true }).waitFor();
			assert.deepEqual(failures, []);
			assert.deepEqual(external, []);
			await context.close();
			console.log(
				`${app} ${width}: registration correction, resident credential login, deletion passed`
			);
		}
} finally {
	await browser.close();
}
console.log(`Virtual WebAuthn mock flows passed. Screenshots: ${folder}`);
