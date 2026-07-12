import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import LandingPage from './+page.svelte';

describe('landing page', () => {
	it('renders translated mobile-first registry content', async () => {
		render(LandingPage);

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Le savoir devient une carte.');
		await expect
			.element(page.getByRole('link', { name: 'Commencer le registre' }))
			.toBeInTheDocument();
		await expect.element(page.getByTestId('full-art-frame')).toHaveClass('alchemy-frame');
		await expect.element(page.getByText('Articles indexés')).toBeInTheDocument();
	});
});
