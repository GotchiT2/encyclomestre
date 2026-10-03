import { afterEach, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import TemplateCard from '$lib/card-renderer/template-card.svelte';
import { validateDefinition } from '$lib/card-renderer/definition';
import rose from '$lib/card-renderer/templates/prestige-rose-champagne.json';
import karina from '$lib/card-renderer/templates/prestige-karina-platinum.json';

afterEach(() => delete document.documentElement.dataset.motion);

it.each(
	[rose, karina].flatMap((source, artist) =>
		[144, 220, 380].flatMap((width) =>
			[false, true].map((missing) => ({ source, artist, width, missing }))
		)
	)
)(
	'keeps Prestige $artist readable at $width px, missing=$missing with reduced motion',
	async ({ source, artist, width, missing }) => {
		document.documentElement.dataset.motion = 'reduce';
		render(TemplateCard, {
			definition: validateDefinition(source),
			data: {
				title: 'Une très longue légende de carte pour vérifier la signature et le titre',
				edition: artist ? 'aespa' : 'BLACKPINK',
				image: missing
					? ''
					: '/images/booster-preview/' + (artist ? 'karina.jpg' : 'blackpink.png'),
				fullArt: true,
				variantName: '',
				serial: 17,
				maximum: 99
			},
			labels: { missing: 'Absente', untitled: 'Sans titre' },
			reveal: true
		});
		const card = document.querySelector<HTMLElement>('[data-testid="template-card"]')!;
		card.style.width = width + 'px';
		await expect.element(page.getByTestId('card-serial')).toHaveTextContent('17/99');
		if (missing) await expect.element(page.getByTestId('card-image-fallback')).toBeVisible();
		else await expect.poll(() => card.querySelector('img')?.naturalWidth ?? 0).toBeGreaterThan(0);
		await expect.poll(() => card.getAnimations({ subtree: true }).length).toBe(0);
		await expect.poll(() => card.getBoundingClientRect().width).toBe(width);
		const signature = card.querySelector<HTMLElement>('[data-card-content="signature"]')!;
		const title = card.querySelector<HTMLElement>('[data-card-content="title"]')!;
		expect(signature.querySelectorAll('path').length).toBe(artist ? 1 : 5);
		expect(signature.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			title.getBoundingClientRect().top + 1
		);
		expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth + 1);
	}
);
