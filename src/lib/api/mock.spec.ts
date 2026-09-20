import { describe, expect, it } from 'vitest';
import { createMockApiResponse } from './mock';

describe('createMockApiResponse', () => {
	it('exposes achievements and makes a claim idempotently conflict after success', async () => {
		const list = createMockApiResponse({ path: '/me/achievements' });
		expect(await list.json()).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: 'collection_10', unlockedAt: expect.any(String) })
			])
		);

		const claimed = createMockApiResponse({
			path: '/me/achievements/collection_10/claim',
			method: 'POST'
		});
		expect(claimed.status).toBe(204);
		const repeated = createMockApiResponse({
			path: '/me/achievements/collection_10/claim',
			method: 'POST'
		});
		expect(repeated.status).toBe(409);
		expect(await repeated.json()).toMatchObject({ code: 'ACHIEVEMENT_CONFLICT' });
	});

	it('expose les contrats WikiForge des boosters et des tags', async () => {
		const catalogue = createMockApiResponse({ path: '/packs' });
		expect(await catalogue.json()).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 1, status: 'OPEN', drawGroups: expect.any(Array) }),
				expect.objectContaining({ status: 'UPCOMING' }),
				expect.objectContaining({ status: 'EXHAUSTED' })
			])
		);
		const details = createMockApiResponse({ path: '/packs/3' });
		expect(await details.json()).toMatchObject({
			id: 3,
			drawGroups: [
				expect.any(Object),
				expect.objectContaining({
					variants: [
						expect.objectContaining({
							maxCopies: 99,
							remainingCopies: 198,
							pages: expect.arrayContaining([expect.objectContaining({ title: 'Wikipédia' })])
						})
					]
				})
			]
		});

		const inventory = createMockApiResponse({ path: '/boosters' });
		expect(await inventory.json()).toMatchObject({
			families: expect.arrayContaining([
				expect.objectContaining({
					family: 'NORMAL',
					available: expect.any(Number),
					max: expect.any(Number),
					bonus: expect.any(Number)
				})
			]),
			slots: expect.arrayContaining([
				expect.objectContaining({ id: expect.any(Number), pack: expect.any(Object) })
			])
		});

		const opening = createMockApiResponse({ path: '/boosters/1/open', method: 'POST' });
		expect(await opening.json()).toMatchObject({
			packId: 1,
			cards: expect.arrayContaining([
				expect.objectContaining({
					id: expect.any(Number),
					pageId: expect.any(Number),
					title: expect.any(String),
					variantId: expect.any(Number),
					packId: 1
				})
			])
		});

		const tags = createMockApiResponse({ path: '/tags' });
		expect(await tags.json()).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: expect.any(Number), name: expect.any(String) })
			])
		);
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
		const registry = createMockApiResponse({ path: '/trades?done=20' });
		const payload = (await registry.json()) as {
			received: { id: number; status: string; offered: unknown[] }[];
			sent: { id: number }[];
			done: { status: string }[];
		};
		expect(payload.received).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: 1,
					status: 'PENDING',
					offered: expect.arrayContaining([
						expect.objectContaining({
							status: 'ADDED',
							card: expect.objectContaining({ title: expect.any(String) })
						})
					])
				})
			])
		);
		expect(payload.sent.length).toBeGreaterThan(0);
		expect(payload.done).toEqual(
			expect.arrayContaining([expect.objectContaining({ status: 'ACCEPTED' })])
		);
		const detail = createMockApiResponse({ path: '/trades/1' });
		expect(await detail.json()).toMatchObject({
			id: 1,
			offered: [
				expect.objectContaining({ card: expect.objectContaining({ title: "Girls' Generation" }) })
			],
			requested: [expect.objectContaining({ card: expect.objectContaining({ title: '2NE1' }) })]
		});

		const created = createMockApiResponse({
			path: '/trades',
			method: 'POST',
			body: {
				recipientId: 4,
				offeredCardIds: [101],
				requestedCardIds: [202],
				message: 'Proposition'
			}
		});
		expect(created.status).toBe(200);
		expect(await created.json()).toMatchObject({
			initiator: expect.objectContaining({ id: 1 }),
			message: 'Proposition',
			status: 'PENDING'
		});
	});

	it('accepte ou refuse uniquement une offre en attente', async () => {
		const response = createMockApiResponse({
			path: '/trades/1/accept',
			method: 'POST'
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ id: 1, status: 'ACCEPTED' });
	});

	it('retourne les partenaires d’échange sans l’utilisateur courant', async () => {
		const response = createMockApiResponse({ path: '/users?excludeCurrent=true' });
		expect(((await response.json()) as { results: { id: string }[] }).results).not.toContainEqual(
			expect.objectContaining({ id: 'demo-user' })
		);
	});

	it('gère les wishlists WikiForge, leurs pages et leurs invitations', async () => {
		const created = createMockApiResponse({
			path: '/wishlists',
			method: 'POST',
			body: {
				name: 'Cartes à échanger',
				description: 'Doublons recherchés.'
			}
		});
		const registry = (await created.json()) as { id: string; name: string };
		expect(created.status).toBe(200);
		expect(registry.name).toBe('Cartes à échanger');

		createMockApiResponse({
			path: `/wishlists/${registry.id}/pages/1`,
			method: 'PUT'
		});
		const cards = createMockApiResponse({
			path: `/wishlists/${registry.id}?page=0&sortBy=ADDED_AT&sortDirection=DESC`
		});
		expect(cards.status).toBe(200);
		expect(await cards.json()).toMatchObject({
			nbResults: 1,
			results: [expect.objectContaining({ page: expect.objectContaining({ id: 1 }) })]
		});

		const invited = createMockApiResponse({
			path: `/wishlists/${registry.id}/shares/17`,
			method: 'POST'
		});
		expect(invited.status).toBe(200);
		const followers = createMockApiResponse({ path: `/wishlists/${registry.id}/shares` });
		expect(await followers.json()).toEqual([expect.objectContaining({ id: 17, accepted: false })]);
	});

	it('persists user blocks in the WikiForge social registry', async () => {
		const blocked = createMockApiResponse({
			path: '/blocks/2',
			method: 'POST'
		});
		expect(blocked.status).toBe(204);

		const blocks = createMockApiResponse({ path: '/blocks' });
		expect(await blocks.json()).toEqual([expect.objectContaining({ id: 2, name: 'SoneS9' })]);
		const friends = createMockApiResponse({ path: '/friends' });
		expect(await friends.json()).toMatchObject({ friends: [expect.objectContaining({ id: 2 })] });

		const unblocked = createMockApiResponse({
			path: '/blocks/2',
			method: 'DELETE'
		});
		expect(unblocked.status).toBe(204);
	});
});
