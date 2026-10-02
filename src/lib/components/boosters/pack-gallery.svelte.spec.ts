import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import type { PackCatalogueItem } from '$lib/types';
import { arcadePreferences } from '$lib/arcade/preferences';
import PackGallery from './pack-gallery.svelte';

const pack = (id: number, available: number): PackCatalogueItem => ({
	id,
	slotId: id,
	position: 1,
	name: `Pack ${id}`,
	description: '',
	family: 'PREMIUM',
	status: 'OPEN',
	nbCards: 5,
	openAll: false,
	drawGroups: [],
	credit: {
		id,
		slotId: id,
		name: `Pack ${id}`,
		description: '',
		family: 'PREMIUM',
		imageUrl: '',
		nbCards: 5,
		regularAvailable: available,
		bonus: 0,
		available,
		max: 1,
		nextAvailableAt: null
	}
});
describe('booster selection without credits', () => {
	beforeEach(() =>
		arcadePreferences.set({ density: 'grid', opening: 'immersive', motion: 'reduce' })
	);
	it('allows navigation to empty and unknown reserves while upcoming packs stay secondary', async () => {
		const onSelect = vi.fn();
		const packs = [
			pack(1, 1),
			pack(2, 0),
			{ ...pack(3, 0), credit: null },
			{ ...pack(4, 1), status: 'UPCOMING' }
		];
		render(PackGallery, { packs, selectedId: 1, onSelect, onDetails: vi.fn() });
		await page.getByRole('button', { name: 'Pack suivant', exact: true }).click();
		expect(onSelect).toHaveBeenCalledWith(packs[1]);
		expect(document.querySelectorAll('.pack-slide')).toHaveLength(3);
	});
	it('retains the selected pack and its neighbors when the last credit is consumed', async () => {
		const props = {
			packs: [pack(1, 1), pack(2, 1), pack(3, 1)],
			selectedId: 2,
			onSelect: vi.fn(),
			onDetails: vi.fn()
		};
		const view = render(PackGallery, props);
		const original = document.querySelector('[data-slide-id="2"]');
		await view.rerender({
			...props,
			packs: props.packs.map((p) => ({
				...p,
				credit: { ...p.credit!, available: 0, regularAvailable: 0 }
			}))
		});
		await expect.element(page.getByText('Aucun crédit disponible', { exact: true })).toBeVisible();
		expect(document.querySelector('[data-slide-id="2"]')).toBe(original);
		await expect
			.element(page.getByRole('button', { name: 'Pack précédent', exact: true }))
			.toBeEnabled();
		await expect
			.element(page.getByRole('button', { name: 'Pack suivant', exact: true }))
			.toBeEnabled();
	});
});
