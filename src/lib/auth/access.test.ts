import { describe, expect, it } from 'vitest';
import { isPublicAuthenticationRoute } from './access';

describe('isPublicAuthenticationRoute', () => {
	it.each(['/', '/login', '/register', '/recovery', '/legal', '/privacy', '/terms', '/login/'])(
		'autorise la route publique %s',
		(pathname) => expect(isPublicAuthenticationRoute(pathname)).toBe(true)
	);

	it.each(['/boosters/apercu', '/cards', '/users/42', '/forgot-password', '/reset-password'])(
		'protège la route applicative %s',
		(pathname) => expect(isPublicAuthenticationRoute(pathname)).toBe(false)
	);
});
