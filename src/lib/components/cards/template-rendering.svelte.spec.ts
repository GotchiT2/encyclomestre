import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import '$lib/i18n';
import VariantFace from './variant-card-face.svelte';
import TemplateCard from '$lib/card-renderer/template-card.svelte';
import { presetDefinition, themes } from '$lib/card-renderer/definition';
import { mockCards } from '$lib/api/mocks/cards';
import { cardDefinition } from '$lib/card-renderer/card-presets';
import { serializeRenderKey } from '$lib/card-renderer/render-key';
const { load } = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('$lib/api/card-templates', () => ({ getCardTemplate: load }));
const labels = {
	normal: 'Normal',
	fullArt: 'Full art',
	missing: 'Absente',
	untitled: 'Sans titre',
	model: 'Modèle'
};
describe('shared card renderer', () => {
	beforeEach(() => load.mockReset());
	it.each([
		{ name: 'empty image', image: '' },
		{ name: 'API placeholder', image: '/card-placeholder.svg' },
		{ name: 'failed image', image: 'data:image/png;base64,bm90LWFuLWltYWdl' }
	])(
		'keeps the WikiForge fallback in portrait for $name and recovers with a real image',
		async ({ image }) => {
			const props = {
				definition: cardDefinition(true),
				data: { title: 'Carte sans illustration', image, variantName: 'Full art', fullArt: true },
				labels
			};
			const view = render(TemplateCard, props);
			await expect.element(page.getByTestId('card-image-fallback')).toBeVisible();
			await expect
				.element(page.getByTestId('template-card'))
				.toHaveAttribute('data-orientation', 'portrait');
			expect(
				document.querySelector('[data-testid="card-image-fallback"] [data-brand="wikiforge"]')
			).not.toBeNull();
			await view.rerender({
				...props,
				data: {
					...props.data,
					image:
						'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="700" height="500"%3E%3C/svg%3E'
				}
			});
			await expect
				.element(page.getByTestId('template-card'))
				.toHaveAttribute('data-orientation', 'landscape');
			await expect.element(page.getByTestId('card-image-fallback')).not.toBeInTheDocument();
		}
	);
	it('renders serial and landscape without stretching title', async () => {
		const definition = presetDefinition('cyberpunk');
		definition.design.orientation = 'landscape';
		render(TemplateCard, {
			definition,
			data: {
				title: 'Un titre long pour une carte de collection',
				image: '',
				variantName: 'Néon',
				fullArt: true,
				serial: 17,
				maximum: 99
			},
			labels
		});
		await expect.element(page.getByTestId('card-serial')).toHaveTextContent('17/99');
		await expect
			.element(page.getByTestId('template-card'))
			.toHaveAttribute('data-orientation', 'landscape');
	});
	it('uses a published definition with actual instance data', async () => {
		load.mockResolvedValue({
			id: 'space',
			revision: 1,
			name: 'Spatial',
			definition: presetDefinition('space')
		});
		render(VariantFace, {
			card: {
				...mockCards[0],
				serialNumber: 17,
				maxCopies: 99,
				variant: { ...mockCards[0].variant, styles: ['FULL_ART'], renderKey: 'tpl:space@1' }
			}
		});
		await expect.element(page.getByTestId('template-card')).toHaveAttribute('data-theme', 'space');
		await expect.element(page.getByTestId('card-serial')).toHaveTextContent('17/99');
	});
	it('renders inline JSON, description and the flame without a detail or template read', async () => {
		render(VariantFace, {
			card: {
				...mockCards[0],
				title: "Ministre de l'Éducation nationale (France)",
				longDescription: 'Une description de collection.',
				serialNumber: 17,
				variant: { ...mockCards[0].variant, renderKey: serializeRenderKey(cardDefinition(false)) }
			}
		});
		await expect
			.element(page.getByTestId('template-card'))
			.toHaveAttribute('data-full-art', 'false');
		expect(document.querySelector('[data-card-content="description"]')?.textContent).toContain(
			'Une description'
		);
		expect(document.querySelector('[data-card-content="logo"] svg')).not.toBeNull();
		expect(document.querySelector('[data-testid="card-serial"]')).toBeNull();
		expect(load).not.toHaveBeenCalled();
	});
	it('reports malformed inline JSON and keeps a usable fallback', async () => {
		render(VariantFace, {
			card: {
				...mockCards[0],
				variant: { ...mockCards[0].variant, renderKey: '{"schemaVersion":3}' }
			}
		});
		await expect.element(page.getByTestId('template-card')).toBeVisible();
		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent('Modèle indisponible : affichage standard.');
		expect(load).not.toHaveBeenCalled();
	});
	it('ignores old template reads after changing the card', async () => {
		let resolve: (v: unknown) => void = () => {};
		load
			.mockImplementationOnce(() => new Promise((r) => (resolve = r)))
			.mockResolvedValueOnce({
				id: 'comics',
				revision: 1,
				name: 'Comics',
				definition: presetDefinition('comics')
			});
		const card = {
			...mockCards[0],
			variant: { ...mockCards[0].variant, renderKey: 'tpl:space@1' }
		};
		const view = render(VariantFace, { card });
		await expect.poll(() => load.mock.calls.length).toBeGreaterThan(0);
		await view.rerender({
			card: { ...card, variant: { ...card.variant, renderKey: 'tpl:comics@1' } }
		});
		await expect.element(page.getByTestId('template-card')).toHaveAttribute('data-theme', 'comics');
		resolve({ id: 'space', revision: 1, name: 'Spatial', definition: presetDefinition('space') });
		await expect.element(page.getByTestId('template-card')).toHaveAttribute('data-theme', 'comics');
	});
});

describe('editable template surfaces', () => {
	it.each(
		themes
			.filter((t) => t !== 'classic')
			.flatMap((theme) => [false, true].map((fullArt) => ({ theme, fullArt })))
	)('renders $theme fullArt=$fullArt without editing controls', async ({ theme, fullArt }) => {
		const definition = presetDefinition(theme);
		definition.design.orientation = 'landscape';
		render(TemplateCard, {
			profile: 'source',
			definition,
			data: {
				title: 'Une très longue légende de carte pour vérifier le cartouche',
				image: '',
				variantName: 'Do not print',
				fullArt,
				serial: 1000000,
				maximum: 1000000,
				boosterLogo:
					'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5WQAAAAASUVORK5CYII='
			},
			labels
		});
		await expect.element(page.getByTestId('card-serial')).toHaveTextContent('1000000/1000000');
		const face = document.querySelector<HTMLElement>('[data-card-zone="frame"]')!;
		expect(getComputedStyle(face).borderRadius).toBe('0px');
		expect(document.querySelector('[data-zone-trigger]')).toBeNull();
		expect(document.querySelector('[data-card-zone="logo"] img')).not.toBeNull();
		expect(face.textContent).not.toContain('Do not print');
		face.parentElement!.style.width = '150px';
		expect(face.getBoundingClientRect().width).toBeLessThanOrEqual(150);
		face.parentElement!.style.width = '380px';
		expect(face.getBoundingClientRect().width).toBeLessThanOrEqual(380);
	});
});

it('moves the neon highlight with the pointer independently of image finish', async () => {
	const definition = presetDefinition('cyberpunk');
	definition.layout!.frameFinish.motion = 'pointer';
	definition.layout!.imageFinish.type = 'glitter';
	render(TemplateCard, {
		profile: 'source',
		definition,
		data: { title: 'Neon', image: '', variantName: '', fullArt: true },
		labels
	});
	const canvas = document.querySelector<HTMLElement>('[data-testid="template-card"]')!;
	canvas.style.width = '380px';
	const finish = canvas.querySelector<HTMLElement>('.finish.frame')!;
	const before = getComputedStyle(finish, '::after').backgroundImage;
	const rect = canvas.getBoundingClientRect();
	canvas.dispatchEvent(
		new PointerEvent('pointermove', {
			pointerType: 'mouse',
			clientX: rect.left + rect.width * 0.8,
			bubbles: true
		})
	);
	await expect.poll(() => getComputedStyle(finish, '::after').backgroundImage).not.toBe(before);
	expect(canvas.querySelector('.picture .finish')?.getAttribute('data-type')).toBe('glitter');
});
