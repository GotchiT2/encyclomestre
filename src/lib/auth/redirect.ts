const defaultRedirect = '/collection';

/** Retourne uniquement un chemin interne pour éviter les redirections ouvertes. */
export function getSafeRedirectTarget(value: string | null, fallback = defaultRedirect): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
	return value;
}

/** URL à utiliser par un futur guard lorsqu'une session est absente. */
export function createLoginRedirect(url: URL): string {
	const redirectTo = `${url.pathname}${url.search}`;
	return `/login?redirectTo=${encodeURIComponent(redirectTo)}`;
}
