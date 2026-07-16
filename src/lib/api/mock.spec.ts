import { describe, expect, it } from 'vitest';
import { createMockApiResponse } from './mock';

describe('createMockApiResponse', () => {
	it('retourne une réponse HTTP 200 avec le contrat de la carte', async () => {
		const response = createMockApiResponse({ path: '/cards/girls-generation-1' });

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			id: 'girls-generation-1',
			wikipediaTitle: "Girls' Generation",
			rarity: 'L',
			variant: 'NORMAL'
		});
	});

	it('retourne un 404 JSON pour une route non gérée', async () => {
		const response = createMockApiResponse({ path: '/not-a-route', method: 'GET' });

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			message: 'Aucune route mock ne correspond à GET /not-a-route.',
			code: 'MOCK_ROUTE_NOT_FOUND'
		});
	});

	it('persiste le profil et filtre les ventes du vendeur', async () => {
		const updated = createMockApiResponse({
			path: '/users/demo-user/profile',
			method: 'PATCH',
			body: { username: 'nouvel-archiviste' }
		});
		expect(updated.status).toBe(200);
		expect(await updated.json()).toMatchObject({
			username: 'nouvel-archiviste'
		});

		const sales = createMockApiResponse({ path: '/sales?sellerId=demo-user' });
		expect(((await sales.json()) as { results: { sellerId: string }[] }).results).toEqual(
			expect.arrayContaining([expect.objectContaining({ sellerId: 'demo-user' })])
		);
	});

	it('expose le registre des offres et crée une offre en attente', async () => {
		const ledger = createMockApiResponse({ path: '/trades?userId=demo-user' });
		expect((await ledger.json()) as { recipientId: string }[]).toEqual(
			expect.arrayContaining([expect.objectContaining({ recipientId: 'demo-user' })])
		);

		const created = createMockApiResponse({
			path: '/trades',
			method: 'POST',
			body: {
				initiatorId: 'demo-user',
				recipientId: 'friend-2',
				offeredCardIds: ['girls-generation-1'],
				requestedCardIds: ['twice-groupe-1']
			}
		});
		expect(created.status).toBe(201);
		expect(await created.json()).toMatchObject({
			initiatorId: 'demo-user',
			status: 'pending'
		});
	});

	it('accepte ou refuse uniquement une offre en attente', async () => {
		const response = createMockApiResponse({
			path: '/trades/trade-001',
			method: 'PATCH',
			body: { status: 'accepted' }
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ id: 'trade-001', status: 'accepted' });
	});

	it('retourne les partenaires d’échange sans l’utilisateur courant', async () => {
		const response = createMockApiResponse({ path: '/users?excludeId=demo-user' });
		expect((await response.json()) as { id: string }[]).not.toContainEqual(
			expect.objectContaining({ id: 'demo-user' })
		);
	});

	it('persiste, filtre et pagine les entrées de wishlist', async () => {
		createMockApiResponse({
			path: '/wishlist',
			method: 'POST',
			body: { userId: 'demo-user', cardId: 'girls-generation-1' }
		});
		createMockApiResponse({
			path: '/wishlist/girls-generation-1?userId=demo-user',
			method: 'PATCH',
			body: { priority: 'high', note: 'À conserver' }
		});

		const response = createMockApiResponse({
			path: '/wishlist?priority=high&page=0&size=1'
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			results: [
				expect.objectContaining({
					cardId: 'girls-generation-1',
					priority: 'high',
					card: expect.objectContaining({ variant: 'NORMAL' })
				})
			],
			page: 0,
			nbResults: 1
		});
	});

	it('gère les registres de desiderata et leur partage', async () => {
		const created = createMockApiResponse({
			path: '/wishlists',
			method: 'POST',
			body: {
				userId: 'demo-user',
				title: 'Cartes à échanger',
				description: 'Doublons recherchés.'
			}
		});
		const registry = (await created.json()) as { id: string; title: string };
		expect(created.status).toBe(201);
		expect(registry.title).toBe('Cartes à échanger');

		const shared = createMockApiResponse({
			path: `/wishlists/${registry.id}/share?userId=demo-user`,
			method: 'POST',
			body: { target: 'guild' }
		});
		expect(shared.status).toBe(200);
		expect(await shared.json()).toMatchObject({ token: registry.id });
	});

	it('filtre les ventes actives pour une carte', async () => {
		const response = createMockApiResponse({ path: '/sales?cardId=red-velvet-1' });
		expect(response.status).toBe(200);
		expect(((await response.json()) as { results: unknown[] }).results).toEqual([
			expect.objectContaining({ cardId: 'red-velvet-1', type: 'auction' })
		]);
	});

	it('resolves punctuation-normalized card ids', async () => {
		const response = createMockApiResponse({ path: '/cards/g-i-dle-2' });
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ id: 'g-i-dle-2' });
	});
});
