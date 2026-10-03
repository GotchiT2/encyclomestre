import assert from 'node:assert/strict';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { boosterArtwork } from '../src/lib/components/boosters/booster-visuals.ts';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, 'static/brand/v1');
const fontStyles = (
	await Promise.all(
		[
			['Barlow', 'Barlow-SemiBold.ttf'],
			['Barlow Condensed', 'BarlowCondensed-Black.ttf']
		].map(
			async ([family, name]) =>
				`@font-face{font-family:'${family}';src:url('data:font/ttf;base64,${(await readFile(join(root, 'static/fonts/arcade', name))).toString('base64')}');font-weight:400 900;}`
		)
	)
).join('');
for (const visual of ['signal', 'circuit', 'prism']) {
	for (const back of [false, true]) {
		const svg = boosterArtwork({
			visual,
			back,
			name: { signal: 'Signal', circuit: 'Circuit', prism: 'Prisme' }[visual],
			count: 5,
			cardsLabel: 'cartes',
			id: `brand-${visual}-${back ? 'back' : 'pack'}`
		});
		await writeFile(
			join(out, `${back ? 'card-back' : 'booster'}-${visual}.svg`),
			svg.replace('<defs>', `<defs><style>${fontStyles}</style>`).replace(/[ \t]+$/gm, '')
		);
	}
}

const jobs = [];
for (const color of ['yellow', 'cream', 'ink']) {
	for (const size of [32, 64, 128, 256, 512, 1024])
		jobs.push([`symbol-${color}.svg`, size, `symbol-${color}-${size}.png`]);
	jobs.push([`wordmark-${color}.svg`, 1024, `wordmark-${color}.png`]);
}
for (const orientation of ['horizontal', 'stacked']) {
	for (const palette of ['dark', 'light', 'mono-cream', 'mono-ink']) {
		for (const size of [512, 2048])
			jobs.push([
				`signature-${orientation}-${palette}.svg`,
				size,
				`signature-${orientation}-${palette}-${size}.png`
			]);
	}
}
for (const size of [180, 192, 512]) jobs.push([`icon-${size}.svg`, size, `icon-${size}.png`]);
for (const size of [192, 512])
	jobs.push([`icon-maskable-${size}.svg`, size, `icon-maskable-${size}.png`]);
jobs.push(['favicon.svg', 16, 'favicon-16.png'], ['social-card.svg', 1200, 'social-card.png']);
for (const size of [32, 48]) {
	const icon = (await readFile(join(out, 'symbol-yellow.svg'), 'utf8')).replace(
		'<title>',
		'<rect width="256" height="256" fill="#171918"/><title>'
	);
	await writeFile(join(out, `favicon-${size}.svg`), icon);
	jobs.push([`favicon-${size}.svg`, size, `favicon-${size}.png`]);
}
for (const visual of ['signal', 'circuit', 'prism']) {
	for (const role of ['booster', 'card-back'])
		jobs.push([`${role}-${visual}.svg`, 512, `${role}-${visual}.png`]);
}
const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	const remote = [];
	await page.route('http{,s}://**/*', (route) => {
		remote.push(route.request().url());
		return route.abort();
	});
	for (const [source, width, output] of jobs) {
		const svg = await readFile(join(out, source), 'utf8');
		const [, originalWidth, originalHeight] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
		const height = Math.round((width * Number(originalHeight)) / Number(originalWidth));
		await page.setViewportSize({ width, height });
		await page.setContent(
			`<style>html,body{margin:0;background:transparent}img{display:block;width:100vw;height:100vh}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"/>`
		);
		await page.waitForFunction(
			() => document.images[0].complete && document.images[0].naturalWidth > 0
		);
		await page.screenshot({ path: join(out, output), omitBackground: true });
	}
	assert.deepEqual(remote, [], 'Asset generation cannot fetch external resources');
} finally {
	await browser.close();
}
await writeFile(
	join(out, 'inventory.json'),
	JSON.stringify(
		{
			identity: 'WikiForge — Taillée',
			font: 'Barlow Condensed Black',
			colors: ['#171918', '#EFEBD9', '#E8EF42'],
			files: (await readdir(out)).sort(),
			rasterExports: jobs.length
		},
		null,
		'\t'
	) + '\n'
);
console.log(`Exported ${jobs.length} PNGs and shared booster/back SVGs without remote requests.`);
