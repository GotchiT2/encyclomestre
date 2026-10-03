import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import FamilyCredits from './family-credits.svelte';

describe('shared booster recharge clocks', () => {
	const now = Date.parse('2026-10-03T12:00:00Z');
	it('counts down both premium families without duplicating a shared reserve', async () => {
		const families = [
			{
				family: 'PREMIUM',
				available: 0,
				max: 1,
				nextAvailableAt: new Date(now + 7209000).toISOString()
			},
			{
				family: 'PREMIUM_PLUS',
				available: 0,
				max: 1,
				nextAvailableAt: new Date(now + 86400000).toISOString()
			}
		];
		const view = render(FamilyCredits, { families: [...families, families[0]], now });
		await expect.element(page.getByText('02:00:09', { exact: true })).toBeVisible();
		await expect.element(page.getByText('24:00:00', { exact: true })).toBeVisible();
		expect(document.querySelectorAll('.family-credit')).toHaveLength(2);
		await view.rerender({ families, now: now + 1000 });
		await expect.element(page.getByText('02:00:08', { exact: true })).toBeVisible();
		await expect.element(page.getByText('23:59:59', { exact: true })).toBeVisible();
	});
	it('waits for the API to confirm a credit at the deadline', async () => {
		const families = [
			{ family: 'PREMIUM', available: 0, max: 1, nextAvailableAt: new Date(now).toISOString() }
		];
		const view = render(FamilyCredits, { families, now });
		await expect.element(page.getByText('Actualisation des crédits…')).toBeVisible();
		expect(document.querySelector('.credit-numbers strong')?.textContent).toBe('0');
		await view.rerender({ families: [{ family: 'PREMIUM', available: 1, max: 1 }], now });
		expect(document.querySelector('.credit-numbers strong')?.textContent).toBe('1');
		expect(document.querySelector('time')).toBeNull();
	});
	it('does not invent a clock when the date is absent or invalid', () => {
		render(FamilyCredits, {
			families: [
				{ family: 'PREMIUM', available: 0, max: 1 },
				{ family: 'PREMIUM_PLUS', available: 0, max: 1, nextAvailableAt: 'invalid' }
			],
			now
		});
		expect(document.querySelectorAll('time')).toHaveLength(0);
	});
});
