import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import ContextualCardRailFixture from './contextual-card-rail.fixture.svelte';

describe('ContextualCardRail', () => {
	afterEach(async () => page.viewport(1280, 720));

	it('provides a swipeable, contained rail on phone viewports', async () => {
		await page.viewport(390, 844);
		render(ContextualCardRailFixture);

		await expect.element(page.getByLabelText('Cartes contextuelles')).toBeVisible();
		await expect.element(page.getByText('1 / 4')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Suivant' })).toBeVisible();
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
			document.documentElement.clientWidth
		);
	});

	it('falls back to a readable grid on desktop', async () => {
		await page.viewport(1280, 720);
		render(ContextualCardRailFixture);

		const track = document.querySelector<HTMLElement>(
			'[data-testid="contextual-card-rail"] > div > div'
		);
		expect(getComputedStyle(track!).display).toBe('grid');
		expect(getComputedStyle(track!).gridTemplateColumns.split(' ')).toHaveLength(4);
		expect(page.getByText('1 / 4').query()).toBeNull();
	});
});
