import { describe, expect, it } from 'vitest';
import { createMockApiResponse } from './mock';

describe('createMockApiResponse', () => {
	it('reads social-state card ids from a POST body', async () => {
		const response = createMockApiResponse({
			path: '/api/cards/social-states',
			method: 'POST',
			body: { cardIds: ['girls-generation-1'] }
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([
			expect.objectContaining({ cardId: 'girls-generation-1' })
		]);
	});

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

	it('expose les trois registres et crée une offre en attente', async () => {
		const received = createMockApiResponse({ path: '/api/trades/received' });
		expect((await received.json()) as { recipientId: string }[]).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					recipientId: 'demo-user',
					initiator: expect.objectContaining({ displayName: expect.any(String) }),
					cards: expect.arrayContaining([
						expect.objectContaining({
							side: 'offered',
							card: expect.objectContaining({ wikipediaTitle: expect.any(String) })
						})
					])
				})
			])
		);
		const initiatorCollection = createMockApiResponse({
			path: '/api/users/friend-0/collection?page=0&size=100'
		});
		expect(
			((await initiatorCollection.json()) as { results: { userCardId: string }[] }).results
		).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ userCardId: 'owned-friend-0-girls-generation-1' })
			])
		);
		const sent = createMockApiResponse({ path: '/api/trades/sended' });
		expect((await sent.json()) as { initiatorId: string }[]).toEqual(
			expect.arrayContaining([expect.objectContaining({ initiatorId: 'demo-user' })])
		);
		const history = createMockApiResponse({ path: '/api/trades/history' });
		expect((await history.json()) as { status: string }[]).toEqual(
			expect.arrayContaining([expect.objectContaining({ status: 'accepted' })])
		);
		const detailedCards = createMockApiResponse({ path: '/api/trades/trade-001/cards' });
		expect(await detailedCards.json()).toEqual([
			expect.objectContaining({
				userCardId: 'owned-friend-0-girls-generation-1',
				side: 'offered',
				card: expect.objectContaining({ wikipediaTitle: "Girls' Generation" })
			}),
			expect.objectContaining({
				userCardId: 'owned-demo-user-2ne1-1',
				side: 'requested',
				card: expect.objectContaining({ wikipediaTitle: '2NE1' })
			})
		]);

		const created = createMockApiResponse({
			path: '/api/trades',
			method: 'POST',
			body: {
				recipientId: 'friend-2',
				offeredUserCardIds: ['girls-generation-1'],
				requestedUserCardIds: ['twice-groupe-1']
			}
		});
		expect(created.status).toBe(200);
		expect(await created.json()).toMatchObject({
			initiatorId: 'demo-user',
			offeredUserCardIds: ['girls-generation-1'],
			status: 'pending'
		});
	});

	it('accepte ou refuse uniquement une offre en attente', async () => {
		const response = createMockApiResponse({
			path: '/api/trades/trade-001',
			method: 'PATCH',
			body: { status: 'accepted' }
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ id: 'trade-001', status: 'accepted' });
	});

	it('retourne les partenaires d’échange sans l’utilisateur courant', async () => {
		const response = createMockApiResponse({ path: '/users?excludeCurrent=true' });
		expect(((await response.json()) as { results: { id: string }[] }).results).not.toContainEqual(
			expect.objectContaining({ id: 'demo-user' })
		);
	});

	it('retourne la même conversation directe lors de deux appels identiques', async () => {
		const first = createMockApiResponse({
			path: '/api/conversations/direct',
			method: 'POST',
			body: { participantId: 'friend-2' }
		});
		const second = createMockApiResponse({
			path: '/api/conversations/direct',
			method: 'POST',
			body: { participantId: 'friend-2' }
		});

		expect(first.status).toBe(200);
		expect(second.status).toBe(200);
		const firstConversation = (await first.json()) as { id: string };
		const secondConversation = (await second.json()) as { id: string };
		expect(firstConversation.id).toBe(secondConversation.id);
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

		createMockApiResponse({
			path: `/wishlists/${registry.id}/cards?cardId=red-velvet-1&userId=demo-user`,
			method: 'POST'
		});
		const cards = createMockApiResponse({
			path: `/wishlists/${registry.id}/cards?userId=demo-user`
		});
		expect(cards.status).toBe(200);
		expect(await cards.json()).toEqual([
			expect.objectContaining({ id: 'red-velvet-1', wikipediaTitle: 'Red Velvet' })
		]);

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

	it('creates a sale for an exact copy and exposes it through collection filters', async () => {
		const created = createMockApiResponse({
			path: '/api/sales',
			method: 'POST',
			body: {
				userCardId: 'owned-2ne1-1-2',
				type: 'auction',
				price: 10,
				durationMinutes: 10
			}
		});
		expect(created.status).toBe(201);
		expect(await created.json()).toMatchObject({
			userCardId: 'owned-2ne1-1-2',
			minimumBid: 11,
			status: 'active'
		});

		const copies = createMockApiResponse({
			path: '/api/collection/variants/2ne1-1/copies'
		});
		expect(await copies.json()).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					userCardId: 'owned-2ne1-1-2',
					activeSale: expect.objectContaining({ id: expect.any(String) })
				})
			])
		);
	});

	it('resolves punctuation-normalized card ids', async () => {
		const response = createMockApiResponse({ path: '/cards/g-i-dle-2' });
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ id: 'g-i-dle-2' });
	});

	it('exposes only public friend wishlists with viewer copy ids', async () => {
		const response = createMockApiResponse({ path: '/api/users/friend-0/wishlists' });
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([
			expect.objectContaining({
				id: 'friend-0-public-wishlist',
				cards: expect.arrayContaining([
					expect.objectContaining({
						viewerOwnedCount: expect.any(Number),
						viewerUserCardIds: expect.any(Array)
					})
				])
			})
		]);
	});

	it('persists user blocks while retaining the friendship record', async () => {
		const blocked = createMockApiResponse({
			path: '/api/users/friend-0/block',
			method: 'PUT'
		});
		expect(blocked.status).toBe(200);

		const blocks = createMockApiResponse({ path: '/api/users/me/blocks' });
		expect(await blocks.json()).toEqual([
			expect.objectContaining({ user: expect.objectContaining({ id: 'friend-0' }) })
		]);
		const friends = createMockApiResponse({ path: '/api/friends' });
		expect(await friends.json()).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ user: expect.objectContaining({ id: 'friend-0' }) })
			])
		);
		const messages = createMockApiResponse({ path: '/api/messages?userId=demo-user' });
		expect(await messages.json()).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining({ participantIds: expect.arrayContaining(['friend-0']) })
			])
		);

		const unblocked = createMockApiResponse({
			path: '/api/users/friend-0/block',
			method: 'DELETE'
		});
		expect(unblocked.status).toBe(204);
	});
});
