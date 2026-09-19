import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { isPublicAuthenticationRoute } from '$lib/auth/access';
import { createLoginRedirect } from '$lib/auth/redirect';
import { restoreSession } from '$lib/auth/session';
import type { LayoutLoad } from './$types';

// La session est conservée dans localStorage : le rendu client évite tout chargement
// de données privées pendant un rendu serveur dépourvu de contexte d'authentification.
export const ssr = false;

export const load: LayoutLoad = ({ url }) => {
	// The isolated preview contains only local fixtures and never opens a real booster.
	const isBoosterPreview = url.pathname.replace(/\/$/, '') === '/boosters/apercu';
	if (
		browser &&
		!isBoosterPreview &&
		!isPublicAuthenticationRoute(url.pathname) &&
		!restoreSession(localStorage)
	) {
		redirect(307, createLoginRedirect(url));
	}
};
