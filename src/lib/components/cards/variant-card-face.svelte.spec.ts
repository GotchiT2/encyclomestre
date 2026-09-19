import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import { mockCards } from '$lib/api/mocks/cards';
import VariantCardFace from './variant-card-face.svelte';

describe('VariantCardFace', () => {
	it('shows the card description on Standard and hides it on Full art', async () => {
		const standard = mockCards.find((card) => card.variant.styles.includes('NORMAL'))!;
		const fullArt = mockCards.find((card) => card.variant.styles.includes('FULL_ART'))!;
		const result = render(VariantCardFace, { card: standard });
		await expect.element(page.getByText(standard.shortDescription)).toBeVisible();
		result.unmount();
		render(VariantCardFace, { card: fullArt });
		await expect.element(page.getByText(fullArt.shortDescription)).not.toBeInTheDocument();
	});

	it('renders a real serial number on a numbered card', async () => {
		const numbered = mockCards.find((card) => card.maxCopies)!;
		render(VariantCardFace, { card: numbered });
		await expect
			.element(page.getByText(`${numbered.serialNumber}/${numbered.maxCopies}`))
			.toBeVisible();
	});
});
