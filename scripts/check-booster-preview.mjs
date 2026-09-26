import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

// Run against the local Vite server: node scripts/check-booster-preview.mjs [base URL].
const base = process.argv[2] ?? 'http://127.0.0.1:5174';
const output = join(tmpdir(), 'wikiforge-booster-preview');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
	viewport: { width: 1440, height: 1050 },
	reducedMotion: 'reduce'
});
const page = await context.newPage();
const errors = [];
const liveOpenings = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('request', (request) => {
	if (new URL(request.url()).pathname.endsWith('/boosters/open')) liveOpenings.push(request.url());
});
const key = 'wikiforge.boosters.preview.v1';
const saved = () => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)), key);
const closeDialog = async () => {
	await page.keyboard.press('Escape');
	await page.locator('[role="dialog"]').waitFor({ state: 'hidden' });
};
const screenshot = async (name) => {
	await page.screenshot({ path: join(output, `${name}.png`), fullPage: true });
};
const scenario = async (value) => {
	const details = page.locator('details');
	if (!(await details.getAttribute('open'))) {
		if (!(await details.evaluate((el) => el.open))) await details.locator('summary').click();
	}
	await page.locator('#demo-scenario').selectOption(value);
};

try {
	await page.clock.setFixedTime(new Date('2026-09-18T12:00:00Z'));
	await page.goto(`${base}/boosters/apercu`);
	await page.getByRole('heading', { level: 1 }).waitFor();
	await page.locator('[data-pack]').last().waitFor();
	assert.equal(await page.locator('[data-pack]').count(), 6);
	await page.locator('.subject-image').first().waitFor();
	await page.evaluate(async () => {
		await document.fonts.ready;
		await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
	});
	assert.equal(await page.locator('button button').count(), 0);
	assert.equal(await page.locator('.variant-label, .edition-label, .ambient-image').count(), 0);
	assert.ok(await page.locator('[data-testid="edition-sigil"]').count());
	assert.equal(
		await page.locator('#variant-gallery .serial-engraving').first().innerText(),
		'X/99'
	);
	assert.equal(
		await page.locator('#variant-gallery [data-variant-id="1"] .face-description').count(),
		1
	);
	assert.equal(
		await page.locator('#variant-gallery [data-variant-id="1"] .face-description').innerText(),
		'Rosé, chanteuse et membre de BLACKPINK, dans une campagne pour PUBG Mobile en 2020.'
	);
	assert.equal(
		await page.locator('#variant-gallery [data-variant-id="3"] .face-description').count(),
		1
	);
	assert.equal(
		await page.locator('#variant-gallery [data-variant-id="2"] .face-description').count(),
		0
	);
	assert.equal(
		await page
			.locator('#variant-gallery [data-variant-id="1"] [data-testid="variant-effects"]')
			.count(),
		0
	);
	assert.equal(
		await page
			.locator('#variant-gallery [data-variant-id="2"] [data-testid="variant-effects"]')
			.count(),
		1
	);
	assert.equal(
		await page
			.locator('#variant-gallery [data-variant-id="1"] .face-description')
			.evaluate((element) => getComputedStyle(element).webkitLineClamp),
		'2'
	);
	const eventFrames = await Promise.all(
		[9, 11, 5, 14].map((id) =>
			page
				.locator(`#variant-gallery [data-variant-id="${id}"] .card-shell`)
				.evaluate((element) => getComputedStyle(element).clipPath)
		)
	);
	assert.equal(new Set(eventFrames).size, 4);
	const interactiveCard = page.locator('#variant-gallery [data-variant-id="2"]');
	await interactiveCard.hover({ position: { x: 40, y: 35 } });
	assert.equal(await interactiveCard.getAttribute('data-effect-active'), 'true');
	assert.notEqual(
		await interactiveCard.evaluate((element) => element.style.getPropertyValue('--pointer-x')),
		'50.00'
	);
	assert.equal(
		await interactiveCard
			.locator('.effect-material')
			.evaluate((element) => getComputedStyle(element).animationName),
		'none'
	);
	await page.mouse.move(0, 0);
	assert.equal(await interactiveCard.getAttribute('data-effect-active'), 'false');
	for (const pack of ['daily', 'chrome', 'nebula', 'arcade', 'neon', 'comics']) {
		const art = page.locator(`[data-pack="${pack}"] [data-testid="pack-art"]`);
		assert.equal(
			await art.getAttribute('data-theme'),
			await art.locator('[data-sigil]').getAttribute('data-sigil')
		);
	}
	await screenshot('desktop-catalogue');
	await page.screenshot({ path: join(output, 'desktop-hero.png') });
	console.log('Catalogue and assets loaded');

	await page
		.locator('[data-pack="nebula"]')
		.getByRole('button', { name: 'Voir le contenu', exact: true })
		.focus();
	await page.keyboard.press('Enter');
	await page.locator('[role="dialog"]').waitFor();
	for (let index = 0; index < 12; index += 1) {
		await page.keyboard.press('Tab');
		assert.equal(
			await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))),
			true
		);
	}
	await page.getByRole('button', { name: 'Exemplaires disponibles', exact: true }).click();
	assert.equal(await page.locator('tbody tr').count(), 10);
	await page.screenshot({ path: join(output, 'desktop-pack-stock.png') });
	await page.locator('#pack-subject').selectOption('star-wars');
	assert.equal(await page.locator('tbody tr').count(), 2);
	await closeDialog();

	await scenario('last');
	await page
		.locator('[data-pack="nebula"]')
		.getByRole('button', { name: 'Ouvrir', exact: true })
		.dblclick();
	await page.getByRole('heading', { name: 'La découverte commence.' }).waitFor();
	assert.equal((await saved()).openings, 1);
	assert.equal(
		await page.getByRole('button', { name: 'Révéler la carte 2', exact: true }).isDisabled(),
		true
	);
	await page.getByRole('button', { name: 'Révéler la carte 1', exact: true }).click();
	await page.getByRole('button', { name: 'Tout révéler', exact: true }).click();
	await page.getByRole('heading', { name: 'Votre nouvelle sélection.' }).waitFor();
	assert.equal(await page.locator('[role="dialog"] [data-testid="preview-card"]').count(), 5);
	const special = page.locator('[role="dialog"] [data-testid="preview-card"]').last();
	assert.match(await special.getAttribute('aria-label'), /7\/10/);
	await page.screenshot({ path: join(output, 'desktop-opening.png') });
	await special.click();
	await page.getByText('Votre exemplaire', { exact: true }).waitFor();
	await page.screenshot({ path: join(output, 'desktop-numbered-card.png') });
	await page.keyboard.press('Escape');
	await page.getByRole('button', { name: 'Retour aux éditions', exact: true }).click();
	assert.equal(await page.locator('[data-pack="nebula"]').count(), 0);
	await page.reload();
	await page.getByRole('heading', { name: 'Éditions épuisées', exact: true }).waitFor();
	assert.equal((await saved()).openings, 1);
	assert.equal(await page.locator('[data-pack="nebula"]').count(), 0);
	console.log('Last serial, double click, reveal order, exhaustion and session reload passed');

	await scenario('daily-wait');
	assert.equal(
		await page
			.locator('[data-pack="daily"]')
			.getByRole('button', { name: 'Ouvrir', exact: true })
			.isDisabled(),
		true
	);
	await scenario('chrome-expired');
	assert.equal(
		await page
			.locator('[data-pack="chrome"]')
			.getByRole('button', { name: 'Ouvrir', exact: true })
			.isDisabled(),
		true
	);
	await scenario('missing-image');
	assert.equal(await page.locator('#variant-gallery .image-fallback').count(), 15);
	await scenario('normal');
	for (const subject of ['blackpink', 'rose', 'karina', 'star-wars', 'lotr']) {
		await page.locator('#gallery-subject').selectOption(subject);
		for (const size of ['150 px', '360 px']) {
			await page.getByRole('button', { name: size, exact: true }).click();
			await page.locator('#variant-gallery').scrollIntoViewIfNeeded();
			await page.evaluate(async () => {
				await Promise.all(
					[...document.querySelectorAll('#variant-gallery img')].map((image) =>
						image.decode().catch(() => {})
					)
				);
			});
			assert.equal(
				await page
					.locator('#variant-gallery .subject-image')
					.evaluateAll(
						(images) => images.filter((image) => !image.complete || image.naturalWidth === 0).length
					),
				0
			);
			const width = await page
				.locator('#variant-gallery [data-testid="preview-card"]')
				.first()
				.evaluate((el) => el.getBoundingClientRect().width);
			assert.equal(Math.round(width), Number.parseInt(size, 10));
			await page
				.locator('#variant-gallery')
				.screenshot({ path: join(output, `gallery-${subject}-${size.split(' ')[0]}.png`) });
		}
	}
	await page.locator('#gallery-subject').selectOption('blackpink');
	assert.equal(
		await page.locator('#variant-gallery [data-variant-id="2"]').getAttribute('data-orientation'),
		'landscape'
	);
	assert.equal(
		await page.locator('#variant-gallery [data-variant-id="1"]').getAttribute('data-orientation'),
		'portrait'
	);
	assert.equal(
		await page
			.locator('#variant-gallery [data-variant-id="2"] .subject-image')
			.evaluate((image) => getComputedStyle(image).objectFit),
		'contain'
	);
	await page.locator('#gallery-subject').selectOption('star-wars');
	assert.equal(
		await page.locator('#variant-gallery [data-variant-id="2"]').getAttribute('data-orientation'),
		'landscape'
	);
	assert.equal(
		await page.locator('#variant-gallery [data-variant-id="1"]').getAttribute('data-orientation'),
		'portrait'
	);
	assert.equal(
		await page
			.locator('#variant-gallery [data-variant-id="2"] .subject-image')
			.evaluate((image) => getComputedStyle(image).objectFit),
		'contain'
	);
	await page.locator('#gallery-subject').selectOption('blackpink');
	await page.evaluate(() => {
		Math.random = () => 0;
	});
	await page
		.locator('[data-pack="daily"]')
		.getByRole('button', { name: 'Ouvrir', exact: true })
		.click();
	assert.equal(
		await page
			.locator('[role="dialog"] .opening-slot')
			.last()
			.getAttribute('class')
			.then((value) => value.includes('landscape')),
		true
	);
	assert.equal(
		await page
			.locator('[role="dialog"] .card-back')
			.last()
			.getAttribute('class')
			.then((value) => value.includes('landscape')),
		true
	);
	await page.getByRole('button', { name: 'Tout révéler', exact: true }).click();
	assert.equal(
		await page
			.locator('[role="dialog"] [data-testid="preview-card"]')
			.last()
			.getAttribute('data-orientation'),
		'landscape'
	);
	await page.screenshot({ path: join(output, 'landscape-opening.png') });
	await closeDialog();
	await scenario('normal');
	console.log('All five subjects loaded in all fifteen variants at 150px and 360px');

	await page.setViewportSize({ width: 390, height: 844 });
	await page.getByRole('button', { name: '150 px', exact: true }).click();
	await page.evaluate(() => window.scrollTo(0, 0));
	assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
	await screenshot('mobile-catalogue');
	await page
		.locator('[data-pack="neon"]')
		.getByRole('button', { name: 'Voir le contenu', exact: true })
		.click();
	await page.screenshot({ path: join(output, 'mobile-pack-detail.png') });
	const dialogBox = await page.locator('[role="dialog"]').boundingBox();
	assert.equal(Math.round(dialogBox.width), 390);
	await page.getByRole('button', { name: 'Exemplaires disponibles', exact: true }).click();
	await page.screenshot({ path: join(output, 'mobile-stock.png') });
	await closeDialog();
	await page
		.locator('[data-pack="daily"]')
		.getByRole('button', { name: 'Ouvrir', exact: true })
		.click();
	await page.getByRole('button', { name: 'Tout révéler', exact: true }).click();
	await page.screenshot({ path: join(output, 'mobile-opening.png') });
	await closeDialog();
	await page.reload();
	await page.locator('[data-pack="daily"]').waitFor();
	assert.equal(
		await page
			.locator('[data-pack="daily"]')
			.getByRole('button', { name: 'Ouvrir', exact: true })
			.isDisabled(),
		true
	);
	assert.deepEqual(errors, []);
	assert.deepEqual(liveOpenings, []);
	await page.goto(`${base}/boosters`);
	await page.waitForURL('**/login?**');

	const touchContext = await browser.newContext({
		viewport: { width: 390, height: 844 },
		isMobile: true,
		hasTouch: true,
		reducedMotion: 'reduce'
	});
	const touchPage = await touchContext.newPage();
	await touchPage.goto(`${base}/boosters/apercu`);
	await touchPage
		.locator('[data-pack="neon"]')
		.getByRole('button', { name: 'Voir le contenu', exact: true })
		.tap();
	await touchPage.locator('[role="dialog"] [data-testid="preview-card"]').nth(1).tap();
	await touchPage.getByText('Crédits de l’illustration', { exact: true }).waitFor();
	assert.equal(await touchPage.locator('[role="dialog"]').count(), 2);
	const touchCardBox = await touchPage
		.locator('[role="dialog"]')
		.last()
		.locator('[data-testid="preview-card"]')
		.boundingBox();
	assert.ok(
		touchCardBox.y >= 0,
		'Card detail opens at the top rather than scrolling to its credit links'
	);
	await touchPage.screenshot({ path: join(output, 'touch-card-detail.png') });
	await touchPage.keyboard.press('Escape');
	await touchPage.keyboard.press('Escape');
	await touchPage.locator('#gallery-subject').selectOption('blackpink');
	const touchEffectCard = touchPage.locator('#variant-gallery [data-variant-id="2"]');
	await touchEffectCard.dispatchEvent('pointerdown', { pointerType: 'touch' });
	assert.equal(await touchEffectCard.getAttribute('data-effect-active'), 'true');
	await touchEffectCard.dispatchEvent('pointerup', { pointerType: 'touch' });
	assert.equal(await touchEffectCard.getAttribute('data-effect-active'), 'false');
	await touchPage.locator('#variant-gallery [data-variant-id="2"]').tap();
	const touchLandscape = touchPage
		.locator('[role="dialog"]')
		.last()
		.locator('[data-testid="preview-card"]');
	assert.equal(await touchLandscape.getAttribute('data-orientation'), 'landscape');
	const landscapeBox = await touchLandscape.boundingBox();
	assert.ok(landscapeBox.x >= 0 && landscapeBox.x + landscapeBox.width <= 390);
	assert.ok(landscapeBox.y >= 0 && landscapeBox.y + landscapeBox.height <= 844);
	await touchPage.screenshot({ path: join(output, 'touch-landscape-card-detail.png') });
	await touchContext.close();

	const motionContext = await browser.newContext({ viewport: { width: 1200, height: 900 } });
	const motionPage = await motionContext.newPage();
	await motionPage.goto(`${base}/boosters/apercu`);
	const motionCard = motionPage.locator('#variant-gallery [data-variant-id="2"]');
	await motionCard.scrollIntoViewIfNeeded();
	await motionCard.hover({ position: { x: 90, y: 120 } });
	assert.equal(await motionCard.getAttribute('data-effect-active'), 'true');
	assert.notEqual(
		await motionCard
			.locator('.effect-material')
			.evaluate((element) => getComputedStyle(element).animationName),
		'none'
	);
	assert.notEqual(
		await motionCard.evaluate((element) => getComputedStyle(element).transform),
		'none'
	);
	await motionCard.screenshot({ path: join(output, 'interactive-full-art.png') });
	await motionContext.close();

	const missingContext = await browser.newContext({ viewport: { width: 320, height: 740 } });
	const missingPage = await missingContext.newPage();
	await missingPage.route('**/images/booster-preview/*', (route) => route.abort());
	await missingPage.goto(`${base}/boosters/apercu`);
	await missingPage.locator('#variant-gallery').scrollIntoViewIfNeeded();
	await missingPage.locator('#variant-gallery .image-fallback').first().waitFor();
	assert.equal(
		await missingPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
		true
	);
	await missingPage.screenshot({ path: join(output, 'missing-images-320.png') });
	await missingContext.close();
	console.log(
		`PASS: desktop/mobile flows, images, states, reload and zero runtime errors. Screenshots: ${output}`
	);
} catch (error) {
	console.error(
		'Browser diagnostics:',
		page.url(),
		errors,
		(await page.locator('body').innerText()).slice(0, 2000)
	);
	await page.screenshot({ path: join(output, 'failure.png') });
	throw error;
} finally {
	await browser.close();
}
