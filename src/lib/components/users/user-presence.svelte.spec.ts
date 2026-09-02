import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import UserPresence from './user-presence.svelte';

describe('UserPresence', () => {
	it.each([
		['TODAY', 'Connecté aujourd’hui', 'bg-emerald-500'],
		['THIS_WEEK', 'Dernière connexion cette semaine', 'bg-cyan-400'],
		['THIS_MONTH', 'Dernière connexion ce mois-ci', 'bg-amber-400'],
		['AWAY', 'Absent depuis plus d’un mois', 'bg-slate-500']
	] as const)('exposes the %s state accessibly', async (value, label, colorClass) => {
		render(UserPresence, { value });
		const presence = page.getByRole('img', { name: label });
		await expect.element(presence).toBeInTheDocument();
		await expect.element(presence).toHaveClass(colorClass);
	});
});
