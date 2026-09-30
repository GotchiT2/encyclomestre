import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import '$lib/i18n';
import { currentBanners } from '$lib/banners/store';
import { currentSession } from '$lib/auth/session';
import GlobalBanners from './global-banners.svelte';
vi.mock('$lib/api/public-env', () => ({ env: {} }));
const banner = {
	id: 981,
	message: 'Annonce persistante',
	level: 'INFO',
	startsAt: '2020-01-01T00:00:00'
};
describe('Site announcements', () => {
	it('keeps a manual dismissal across replacement and remount while showing new announcements', async () => {
		sessionStorage.clear();
		currentSession.set(null);
		currentBanners.set([banner]);
		const view = render(GlobalBanners);
		await expect.element(page.getByText(banner.message)).toBeVisible();
		await page.getByRole('button', { name: 'Fermer cette annonce' }).click();
		currentBanners.set([{ ...banner }, { ...banner, id: 982, message: 'Nouvelle annonce' }]);
		await expect.element(page.getByText(banner.message)).not.toBeInTheDocument();
		await expect.element(page.getByText('Nouvelle annonce')).toBeVisible();
		await view.unmount();
		render(GlobalBanners);
		await expect.element(page.getByText(banner.message)).not.toBeInTheDocument();
		await expect.element(page.getByText('Nouvelle annonce')).toBeVisible();
	});
	it('does not display an expired announcement', async () => {
		sessionStorage.clear();
		currentBanners.set([{ ...banner, endsAt: '2020-01-02T00:00:00' }]);
		render(GlobalBanners);
		await expect.element(page.getByText(banner.message)).not.toBeInTheDocument();
	});
});
