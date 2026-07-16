import { describe, expect, it } from 'vitest';
import { createLoginRedirect, getSafeRedirectTarget } from './redirect';

describe('redirection après authentification', () => {
	it('conserve un chemin interne', () => {
		expect(getSafeRedirectTarget('/cards?filter=rare')).toBe('/cards?filter=rare');
	});

	it('rejette les destinations externes', () => {
		expect(getSafeRedirectTarget('https://example.test')).toBe('/');
		expect(getSafeRedirectTarget('//example.test')).toBe('/');
	});

	it('construit une URL de connexion avec le chemin complet', () => {
		expect(createLoginRedirect(new URL('https://app.test/collection?tag=music'))).toBe(
			'/login?redirectTo=%2Fcollection%3Ftag%3Dmusic'
		);
	});
});
