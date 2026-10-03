import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const base = process.env.CARD_TEST_BASE ?? 'https://dev.wikiforge.fr';
const bo = process.env.CARD_BO_TEST_BASE ?? 'https://dev-bo.wikiforge.fr:5174';
const output = join(tmpdir(), 'wikiforge-card-designs');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const failures = [],
	measurements = [];
const longTitle = "Ministre de l'Éducation nationale (France)";
async function context(width, front = true) {
	const ctx = await browser.newContext({
		viewport: { width, height: 1000 },
		ignoreHTTPSErrors: true
	});
	await ctx.route('**/*', (route) => {
		const request = route.request(),
			url = new URL(request.url());
		if (
			url.hostname === 'api.wikiforge.fr' ||
			(url.pathname.startsWith('/api/') && request.method() !== 'GET')
		) {
			failures.push('Live API forbidden: ' + request.url());
			return route.abort();
		}
		return route.continue();
	});
	if (front)
		await ctx.addInitScript(() =>
			localStorage.setItem(
				'encyclomestre.auth-session',
				JSON.stringify({
					accessToken: 'mock',
					user: { id: '1', username: 'Demo', displayName: 'Demo', role: 'user', money: 10000 }
				})
			)
		);
	const page = await ctx.newPage();
	page.on('pageerror', (error) => failures.push(error.message));
	return { ctx, page };
}
async function choose(page, field, value) {
	const label = await field
		.locator('..')
		.locator('select option')
		.evaluateAll((items, wanted) => items.find((item) => item.value === wanted)?.text, value);
	assert.ok(label, 'Select option ' + value);
	await field.click();
	await page.getByRole('option', { name: label, exact: true }).click();
}
async function geometry(card) {
	return card.evaluate((node) => {
		const r = node.getBoundingClientRect(),
			result = {
				width: r.width,
				height: r.height,
				orientation: node.dataset.orientation,
				fullArt: node.dataset.fullArt,
				zones: {}
			};
		for (const el of node.querySelectorAll('[data-card-zone]')) {
			const b = el.getBoundingClientRect(),
				css = getComputedStyle(el);
			result.zones[el.dataset.cardZone] = {
				x: b.x - r.x,
				y: b.y - r.y,
				w: b.width,
				h: b.height,
				color: css.color,
				background: css.backgroundImage,
				font: css.fontFamily,
				size: css.fontSize
			};
		}
		return result;
	});
}
async function openDetails(panel, label) {
	const summary = panel.getByText(label, { exact: true });
	if (!(await summary.evaluate((node) => node.parentElement.open))) await summary.click();
}
try {
	for (const width of [360, 390, 768, 1024, 1440]) {
		const { ctx, page } = await context(width);
		await page.goto(base + '/arcade/validation');
		const cases = page.getByTestId('card-design-validation');
		await cases.waitFor();
		await page.evaluate(() => document.fonts.ready);
		const normal = cases.locator('[data-design-case="normal-long"] [data-testid="template-card"]');
		const portrait = cases.locator(
			'[data-design-case="full-long-portrait"] [data-testid="template-card"]'
		);
		const landscape = cases.locator(
			'[data-design-case="full-long-landscape"] [data-testid="template-card"]'
		);
		await landscape.locator('img').scrollIntoViewIfNeeded();
		await page.waitForFunction(() =>
			document.querySelector(
				'[data-design-case="full-long-landscape"] [data-orientation="landscape"]'
			)
		);
		for (const card of [normal, portrait, landscape]) {
			const g = await geometry(card);
			assert.ok(g.width <= 144.1, 'Compact card ' + width);
			assert.ok(
				Math.abs(g.width / g.height - (g.orientation === 'landscape' ? 7 / 5 : 5 / 7)) < 0.01,
				'Ratio ' + width
			);
			assert.equal(await card.locator('[data-card-content=title]').innerText(), longTitle);
			assert.equal(await card.locator('[data-card-content=logo] svg').count(), 1);
			measurements.push({ width, ...g });
		}
		assert.equal(await normal.getByTestId('card-serial').count(), 0);
		assert.equal(await portrait.getByTestId('card-serial').innerText(), '17/99');
		const description = await normal.locator('[data-card-content=description]').evaluate((node) => {
			const child = node.firstElementChild,
				line = parseFloat(getComputedStyle(child).lineHeight);
			return {
				lines: Number(child.style.webkitLineClamp),
				expected: Math.max(1, Math.floor(node.clientHeight / line)),
				visible: getComputedStyle(child).visibility
			};
		});
		assert.equal(description.lines, description.expected, 'Description available lines');
		assert.equal(description.visible, 'visible');
		assert.ok(
			await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
			'Overflow ' + width
		);
		await cases.screenshot({ path: join(output, 'cards-' + width + '.png') });
		await page.addStyleTag({ content: 'html {font-size:200% !important}' });
		assert.ok(
			await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
			'Enlarged text ' + width
		);
		await cases.screenshot({ path: join(output, 'cards-text-' + width + '.png') });
		await ctx.close();
		console.log('Cards, long title, ratios and text enlargement: ' + width);
	}
	// Manipulation uses actual editable frames; reduced motion cancels them.
	const motion = await context(1024);
	await motion.page.goto(base + '/arcade/validation');
	const shine = motion.page.locator('[data-design-case=chrome] [data-card-zone=shine]');
	await motion.page.locator('[data-design-case=chrome] [data-profile=wikiforge]').hover();
	assert.ok(
		(await shine.evaluate((node) => node.getAnimations().length)) > 0,
		'Editable pointer animation'
	);
	await motion.page.emulateMedia({ reducedMotion: 'reduce' });
	await motion.page.waitForTimeout(50);
	assert.equal(await shine.evaluate((node) => node.getAnimations().length), 0, 'Reduced motion');
	await motion.ctx.close();
	for (const width of [360, 390, 768, 1024, 1440]) {
		const { ctx, page } = await context(width, false);
		await page.goto(bo + '/login');
		await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
		await page.waitForURL('**/packs');
		await page.goto(bo + '/card-sandbox');
		const hero = page.getByTestId('interactive-card');
		await hero.waitFor();
		await hero.getByRole('button', { name: 'Cadre extérieur', exact: true }).click();
		const panel = width < 1280 ? page.getByRole('dialog') : page.locator('aside');
		await panel.getByTestId('blueprint-editor').waitFor();
		await choose(page, panel.getByLabel('Élément à modifier', { exact: true }), 'title');
		await panel.getByLabel('background', { exact: true }).fill('#E8EF42');
		await openDetails(panel, 'Propriétés CSS en JSON');
		const styles = panel.getByRole('textbox', { name: 'Propriétés CSS en JSON', exact: true });
		const previous = await hero.locator('[data-card-zone=title]').getAttribute('style');
		await styles.fill('{"background":"url(https://invalid.test/x)"}');
		await panel.getByRole('alert').waitFor();
		assert.equal(
			await hero.locator('[data-card-zone=title]').getAttribute('style'),
			previous,
			'Invalid draft does not replace render'
		);
		await choose(page, panel.getByLabel('Élément à modifier', { exact: true }), 'logo');
		await choose(page, panel.getByLabel('Élément à modifier', { exact: true }), 'title');
		await openDetails(panel, 'Propriétés CSS en JSON');
		assert.equal(
			await styles.inputValue(),
			'{"background":"url(https://invalid.test/x)"}',
			'Invalid draft restored'
		);
		await styles.fill('{"background":"#E8EF42","color":"#171918","font-size":"7cqw"}');
		await panel.getByText('Template JSON · renderKey', { exact: true }).click();
		await panel
			.getByRole('button', { name: 'Afficher le JSON du rendu actuel', exact: true })
			.click();
		const json = panel.getByRole('textbox', { name: 'Template JSON · renderKey', exact: true });
		const template = JSON.parse(await json.inputValue());
		assert.equal(template.schemaVersion, 3);
		template.presentation.layers.find((layer) => layer.id === 'logo').style.color = '#fa6040';
		await json.fill(JSON.stringify(template));
		assert.equal(
			await hero.locator('[data-card-zone=logo]').evaluate((n) => getComputedStyle(n).color),
			'rgb(250, 96, 64)'
		);
		const [download] = await Promise.all([
			page.waitForEvent('download'),
			panel.getByRole('button', { name: 'Télécharger le template', exact: true }).click()
		]);
		await download.saveAs(join(output, 'template-' + width + '.json'));
		if (width < 1280) await page.keyboard.press('Escape');
		await page.getByRole('button', { name: 'Annuler la modification', exact: true }).click();
		assert.equal(
			await hero.locator('[data-card-zone=logo]').evaluate((n) => getComputedStyle(n).color),
			'rgb(23, 25, 24)'
		);
		await page.getByRole('button', { name: 'Rétablir', exact: true }).click();
		assert.equal(
			await hero.locator('[data-card-zone=logo]').evaluate((n) => getComputedStyle(n).color),
			'rgb(250, 96, 64)'
		);
		assert.ok(
			await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
			'Studio overflow ' + width
		);
		await page.screenshot({ path: join(output, 'studio-' + width + '.png'), fullPage: true });
		await page.waitForTimeout(350);
		await page.reload();
		await hero.waitFor();
		assert.equal(
			await hero.locator('[data-card-zone=logo]').evaluate((n) => getComputedStyle(n).color),
			'rgb(250, 96, 64)'
		);
		await ctx.close();
		console.log('Studio editing, drafts, import/export and undo/redo: ' + width);
	}
	// Compare the two real applications using the same JSON, content and 144px slot.
	const fo = await context(1440),
		back = await context(1440, false);
	await fo.page.goto(base + '/arcade/validation');
	await fo.page.getByTestId('card-design-validation').waitFor();
	await back.page.goto(bo + '/login');
	await back.page.getByRole('button', { name: 'Se connecter', exact: true }).click();
	await back.page.waitForURL('**/packs');
	const sample = await fo.page.locator('[data-design-case=normal-long]').evaluate((node) => ({
		title: node.querySelector('[data-card-content=title]').textContent,
		description: node.querySelector('[data-card-content=description]').textContent,
		edition: node.querySelector('[data-card-content=collection]').textContent
	}));
	await back.page.evaluate(async (sample) => {
		const { initialWorkspace, keyFor, previewFromComposition } =
			await import('/src/lib/sandbox/model.ts');
		const w = initialWorkspace(sample.title);
		w.shared = { ...sample, image: '/sandbox/karina.jpg' };
		w.view = 'compare';
		w.previews = ['atelier', 'full-art', 'full-art'].map((id, index) => ({
			...previewFromComposition(id),
			linked: false,
			content: { ...sample, image: index === 2 ? '/sandbox/blackpink.png' : '/sandbox/karina.jpg' },
			numbering: index === 0 ? 'none' : 'limited',
			serial: 17,
			maximum: 99
		}));
		localStorage.setItem(
			keyFor(JSON.parse(localStorage.getItem('wikiforge-bo-session')).user.id),
			JSON.stringify(w)
		);
	}, sample);
	await back.page.goto(bo + '/card-sandbox');
	await back.page.getByTestId('preview-panel').first().waitFor();
	await back.page.addStyleTag({
		content: '[data-testid=preview-panel] .size {width:144px!important}'
	});
	await Promise.all([
		fo.page.evaluate(() => document.fonts.ready),
		back.page.evaluate(() => document.fonts.ready)
	]);
	const concordanceCases = ['normal-long', 'full-long-portrait', 'full-long-landscape'];
	for (const [index, id] of concordanceCases.entries()) {
		const frontCard = fo.page.locator(`[data-design-case=${id}] [data-testid=template-card]`);
		const backCard = back.page.getByTestId('preview-panel').nth(index).getByTestId('sandbox-card');
		await frontCard.scrollIntoViewIfNeeded();
		await backCard.scrollIntoViewIfNeeded();
		await Promise.all([
			frontCard.locator('img').evaluate((image) => image.decode()),
			backCard.locator('img').evaluate((image) => image.decode())
		]);
		const a = await geometry(frontCard),
			b = await geometry(backCard);
		assert.equal(a.orientation, b.orientation, 'FO/BO orientation ' + id);
		for (const zone of Object.keys(a.zones)) {
			for (const prop of ['x', 'y', 'w', 'h'])
				assert.ok(
					Math.abs(a.zones[zone][prop] - b.zones[zone][prop]) < 0.15,
					'FO/BO geometry ' + zone + ' ' + prop
				);
			for (const prop of ['font', 'size', 'color', 'background'])
				assert.equal(a.zones[zone][prop], b.zones[zone][prop], 'FO/BO style ' + zone + ' ' + prop);
		}
		await frontCard.screenshot({ path: join(output, id + '-fo.png') });
		await backCard.screenshot({ path: join(output, id + '-bo.png') });
	}
	// Variant save uses the existing mock controller; invalid input stays editable.
	await back.page.goto(bo + '/variants');
	await back.page.getByRole('button', { name: 'Modifier', exact: true }).first().click();
	const sheet = back.page.getByRole('dialog');
	const renderKey = sheet.getByRole('textbox', { name: 'Template JSON · renderKey', exact: true });
	const original = await renderKey.inputValue();
	await renderKey.fill('{"schemaVersion":99}');
	await sheet.getByRole('button', { name: 'Enregistrer', exact: true }).click();
	await sheet
		.getByText(
			'Template invalide : le dernier rendu valide est conservé. Vérifiez les propriétés, les calques et les animations.',
			{ exact: true }
		)
		.waitFor();
	assert.equal(await renderKey.inputValue(), '{"schemaVersion":99}');
	const saved = JSON.parse(original);
	saved.presentation.layers.find((layer) => layer.id === 'logo').style.color = '#fa6040';
	await renderKey.fill(JSON.stringify(saved));
	await sheet.getByRole('button', { name: 'Enregistrer', exact: true }).click();
	await sheet.waitFor({ state: 'hidden' });
	await back.page.getByRole('button', { name: 'Modifier', exact: true }).first().click();
	assert.deepEqual(
		JSON.parse(await renderKey.inputValue()),
		saved,
		'Variant JSON saved without case folding or truncation'
	);
	await fo.ctx.close();
	await back.ctx.close();
	assert.deepEqual(failures, []);
	await writeFile(join(output, 'measurements.json'), JSON.stringify(measurements, null, 2));
	console.log('FO/BO concordance, motion and mock-only network checks passed. ' + output);
} finally {
	await browser.close();
}
