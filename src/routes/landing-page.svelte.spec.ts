import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';

vi.mock('$lib/api', async () => {
	const { mockCards } = await import('$lib/api/mocks/cards');
	return {
		getCards: vi.fn().mockResolvedValue({
			items: [mockCards.find((card) => card.isFullArt) ?? mockCards[0]]
		}),
		getWikiForgeWelcome: vi.fn()
	};
});

import LandingPage from './+page.svelte';

describe('landing page', () => {
	it('renders translated mobile-first registry content', async () => {
		render(LandingPage);

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Collectionnez des cartes issues de Wikipédia.');
		await expect.element(page.getByRole('link', { name: 'Créer un compte' })).toBeInTheDocument();
		await expect.element(page.getByTestId('full-art-frame')).toHaveClass('max-w-sm');
		await expect
			.element(page.getByTestId('full-art-frame').getByTestId('card-tile'))
			.toHaveAttribute('data-frame', '/images/card-L---Overframe-empty.png');
		await expect.element(page.getByText('Articles indexés')).toBeInTheDocument();
	});
});
