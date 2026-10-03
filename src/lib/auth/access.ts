const publicAuthenticationRoutes = new Set([
	'/',
	'/login',
	'/register',
	'/recovery',
	'/legal',
	'/privacy',
	'/terms'
]);

export function isPublicAuthenticationRoute(pathname: string): boolean {
	const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
	return publicAuthenticationRoutes.has(normalizedPath);
}
