import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { mockCards } from '$lib/api/mocks/cards';
import VariantCardFace from './variant-card-face.svelte';

describe('VariantCardFace', () => {
	it('uses available description lines on normal cards and keeps full art image-led', async () => {
		const standard = mockCards.find((card) => card.variant.styles.includes('NORMAL'))!;
		const fullArt = mockCards.find((card) => card.variant.styles.includes('FULL_ART'))!;
		const result = render(VariantCardFace, { card: standard });
		await expect
			.element(page.getByText(standard.longDescription || standard.shortDescription))
			.toBeInTheDocument();
		result.unmount();
		render(VariantCardFace, { card: fullArt });
		await expect.element(page.getByText(fullArt.shortDescription)).not.toBeInTheDocument();
	});

	it('renders a real serial number on a numbered card', async () => {
		const numbered = mockCards.find(
			(card) => card.maxCopies && card.variant.styles.includes('FULL_ART')
		)!;
		render(VariantCardFace, { card: numbered });
		await expect
			.element(page.getByText(`${numbered.serialNumber}/${numbered.maxCopies}`))
			.toBeVisible();
	});

	it('reports the landscape orientation of a Full Art image to its container', async () => {
		const fullArt = mockCards.find((card) => card.variant.styles.includes('FULL_ART'))!;
		const onOrientationChange = vi.fn();
		const landscapeCard = {
			...fullArt,
			imageUrl:
				'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"%3E%3C/svg%3E'
		};
		const result = render(VariantCardFace, {
			card: landscapeCard,
			onOrientationChange
		});

		await expect
			.poll(() =>
				result.container.querySelector('[data-orientation]')?.getAttribute('data-orientation')
			)
			.toBe('landscape');
		expect(onOrientationChange).toHaveBeenLastCalledWith(true);

		await result.rerender({
			card: { ...landscapeCard, sharedWishlistMemberships: [] },
			onOrientationChange
		});
		expect(
			result.container.querySelector('[data-orientation]')?.getAttribute('data-orientation')
		).toBe('landscape');
	});
});
