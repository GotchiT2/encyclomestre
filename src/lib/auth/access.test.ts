import { describe, expect, it } from 'vitest';
import { isPublicAuthenticationRoute } from './access';

describe('isPublicAuthenticationRoute', () => {
	it.each(['/login', '/register', '/forgot-password', '/reset-password', '/login/'])(
		'autorise la route publique %s',
		(pathname) => expect(isPublicAuthenticationRoute(pathname)).toBe(true)
	);

	it.each(['/', '/cards', '/users/42'])('protège la route applicative %s', (pathname) =>
		expect(isPublicAuthenticationRoute(pathname)).toBe(false)
	);
});
