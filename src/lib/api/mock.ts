import type {
	AuthSession,
	CardPriceHistory,
	CreateUserInput,
	UpdateUserInput,
	UpdateUserPreferencesInput,
	User,
	SaleListing,
	ProfileSettings,
	TradeOffer,
	CreateTradeOfferInput,
	BoosterInventory,
	BoosterOpenResult,
	WishlistEntry,
	WishlistRegistry,
	GuildWishlistShare,
	Friendship,
	Conversation,
	MessageRecord,
	SaleBid
} from '$lib/types';
import { mockCards } from './mocks/cards';
import { mockCollectionTags } from './mocks/collection-tags';

export interface MockApiRequest {
	path: string;
	method?: string;
	body?: unknown;
}

const now = '2026-07-11T09:00:00.000Z';
const defaultPreferences = {
	language: 'fr',
	timezone: 'Europe/Paris',
	emailNotifications: true,
	marketingEmails: false
};
const users = new Map<string, User>([
	[
		'demo-user',
		{
			id: 'demo-user',
			username: 'collectionneur-demo',
			displayName: 'Camille Martin',
			email: 'camille@example.test',
			avatarUrl: null,
			bio: 'Collectionneuse de cartes et passionnée par les éditions limitées.',
			role: 'user',
			preferences: { ...defaultPreferences },
			createdAt: '2024-03-15T10:30:00.000Z',
			updatedAt: now
		}
	]
]);

const sales: SaleListing[] = [
	{
		id: 'sale-001',
		sellerId: 'demo-user',
		cardId: 'girls-generation-1',
		price: 42.5,
		currency: 'EUR',
		type: 'direct'
	},
	{
		id: 'sale-002',
		sellerId: 'demo-user',
		cardId: 'red-velvet-1',
		price: 65,
		currency: 'EUR',
		type: 'auction'
	},
	{
		id: 'sale-003',
		sellerId: 'friend-0',
		cardId: 'girls-generation-2',
		price: 54,
		currency: 'EUR',
		type: 'auction'
	},
	{
		id: 'sale-004',
		sellerId: 'friend-1',
		cardId: 'blackpink-1',
		price: 39,
		currency: 'EUR',
		type: 'direct'
	}
];
const saleBids: SaleBid[] = [
	{
		id: 'bid-1',
		saleId: 'sale-003',
		bidderName: 'OnMyGhost',
		amount: 38,
		createdAt: '2026-07-13T13:05:00.000Z'
	},
	{
		id: 'bid-2',
		saleId: 'sale-003',
		bidderName: 'SoneS9',
		bidderId: 'demo-user',
		amount: 46,
		createdAt: '2026-07-13T13:28:00.000Z'
	},
	{
		id: 'bid-3',
		saleId: 'sale-003',
		bidderName: 'Assassinblanc',
		amount: 54,
		createdAt: '2026-07-13T14:08:00.000Z'
	}
];
const wishlist = new Map<string, WishlistEntry[]>([
	[
		'demo-user',
		[
			{
				cardId: 'red-velvet-1',
				priority: 'medium',
				note: 'Suivre la prochaine enchère.',
				createdAt: now,
				updatedAt: now
			},
			{
				cardId: 'blackpink-1',
				priority: 'medium',
				note: null,
				createdAt: now,
				updatedAt: now
			}
		]
	]
]);
const wishlists = new Map<string, WishlistRegistry[]>([
	[
		'demo-user',
		[
			{
				id: 'desiderata-priorities',
				userId: 'demo-user',
				title: 'Priorités K-Pop',
				description: 'Les pièces à obtenir avant la prochaine lune.',
				cardIds: ['girls-generation-1', 'blackpink-1', 'red-velvet-1'],
				createdAt: now,
				updatedAt: now
			},
			{
				id: 'desiderata-generation-2',
				userId: 'demo-user',
				title: 'Génération 2',
				description: 'Archives de la seconde génération.',
				cardIds: ['girls-generation-2', '2ne1-1', 'kara-groupe-1'],
				createdAt: now,
				updatedAt: now
			}
		]
	]
]);
const guildWishlistShares: GuildWishlistShare[] = [];
const conversations: Conversation[] = [
	{
		id: 'conversation-guild',
		kind: 'guild',
		title: 'Guilde du Registre',
		participantIds: ['demo-user', 'friend-0', 'friend-1'],
		preview: 'Les souhaits de la guilde sont disponibles.',
		unreadCount: 1,
		updatedAt: now
	},
	{
		id: 'conversation-friend-0',
		kind: 'direct',
		title: 'SoneS9',
		participantIds: ['demo-user', 'friend-0'],
		preview: 'Je peux regarder mes doubles.',
		unreadCount: 0,
		updatedAt: '2026-07-10T15:00:00.000Z'
	}
];
const messages = new Map<string, MessageRecord[]>([
	[
		'conversation-guild',
		[
			{
				id: 'message-guild-1',
				conversationId: 'conversation-guild',
				senderId: 'friend-0',
				content: 'Les souhaits de la guilde sont disponibles.',
				createdAt: now,
				readAt: null,
				reactions: [{ emoji: '❤️', userIds: ['demo-user'] }],
				wishlistShare: {
					registryId: 'desiderata-priorities',
					title: 'Priorités K-Pop',
					description: 'Les pièces à obtenir avant la prochaine lune.',
					cardCount: 3
				}
			}
		]
	],
	[
		'conversation-friend-0',
		[
			{
				id: 'message-friend-0-1',
				conversationId: 'conversation-friend-0',
				senderId: 'friend-0',
				content: 'Je peux regarder mes doubles.',
				createdAt: '2026-07-10T15:00:00.000Z',
				readAt: '2026-07-10T15:02:00.000Z',
				reactions: [],
				tradeOffer: {
					offerId: 'trade-001',
					offeredCardIds: ['twice-groupe-1'],
					requestedCardIds: ['girls-generation-1'],
					offeredCredits: 15,
					requestedCredits: 0,
					status: 'pending'
				}
			}
		]
	]
]);
const friendships = new Map<string, Friendship[]>();
const boosterReserve = new Map<string, { available: number; lastRechargeAt: number }>([
	['demo-user', { available: 10, lastRechargeAt: Date.now() }]
]);
const boosterCapacity = 10;
const rechargeMs = 10 * 60 * 1000;
const tradeOffers: TradeOffer[] = [
	{
		id: 'trade-001',
		initiatorId: 'friend-0',
		recipientId: 'demo-user',
		offeredCardIds: ['twice-groupe-1'],
		requestedCardIds: ['girls-generation-1'],
		offeredCredits: 15,
		requestedCredits: 0,
		status: 'pending',
		createdAt: '2026-07-10T08:00:00.000Z',
		updatedAt: '2026-07-10T08:00:00.000Z'
	},
	{
		id: 'trade-002',
		initiatorId: 'demo-user',
		recipientId: 'friend-1',
		offeredCardIds: ['red-velvet-1'],
		requestedCardIds: ['blackpink-1'],
		offeredCredits: 0,
		requestedCredits: 25,
		status: 'accepted',
		createdAt: '2026-07-01T08:00:00.000Z',
		updatedAt: '2026-07-02T09:30:00.000Z'
	}
];
const profileSettings = new Map<string, ProfileSettings>([
	[
		'demo-user',
		{
			username: 'collectionneur-demo',
			avatarCardId: null,
			accentColor: '#C19A6B',
			bioTags: [],
			showcases: [],
			wantedCardIds: [],
			nsfwEnabled: false,
			censoredKeywords: []
		}
	]
]);

for (const [index, username] of [
	'SoneS9',
	'TaeyeonFan',
	'OnceForever',
	'MinjiStan',
	'UaenaCore',
	'RetroKpop'
].entries()) {
	users.set(`friend-${index}`, {
		id: `friend-${index}`,
		username,
		displayName: username,
		email: `${username.toLowerCase()}@example.test`,
		avatarUrl: mockCards[index].imageUrl,
		bio: 'Collectionneur du registre impérial.',
		role: 'user',
		preferences: { ...defaultPreferences },
		createdAt: '2025-01-01T00:00:00.000Z',
		updatedAt: now
	});
}

profileSettings.set('friend-0', {
	username: 'SoneS9',
	avatarCardId: 'girls-generation-2',
	accentColor: '#C19A6B',
	bioTags: ['collection', 'generation-2'],
	showcases: [
		{
			id: 'friend-0-gallery-1',
			title: 'Pièces favorites',
			cardIds: ['girls-generation-2', 'twice-groupe-1', 'kara-groupe-1']
		}
	],
	wantedCardIds: ['girls-generation-1', 'red-velvet-1'],
	nsfwEnabled: false,
	censoredKeywords: []
});

profileSettings.set('friend-1', {
	username: 'TaeyeonFan',
	avatarCardId: 'blackpink-1',
	accentColor: '#A855F7',
	bioTags: ['vocal', 'full-art'],
	showcases: [
		{
			id: 'friend-1-gallery-1',
			title: 'Archives en lumière',
			cardIds: ['blackpink-1', 'red-velvet-1']
		}
	],
	wantedCardIds: ['girls-generation-1', '2ne1-1'],
	nsfwEnabled: false,
	censoredKeywords: []
});

friendships.set('demo-user', [
	{
		id: 'friendship-001',
		user: { ...users.get('friend-0')! },
		status: 'accepted',
		createdAt: now,
		lastActiveAt: now
	},
	{
		id: 'friendship-002',
		user: { ...users.get('friend-1')! },
		status: 'received',
		createdAt: now,
		lastActiveAt: now
	}
]);

function json(payload: unknown, status = 200): Response {
	return new Response(status === 204 ? undefined : JSON.stringify(payload), {
		status,
		headers: status === 204 ? undefined : { 'content-type': 'application/json; charset=utf-8' }
	});
}

function error(status: number, message: string, code: string): Response {
	return json({ message, code }, status);
}

function asObject(value: unknown): Record<string, unknown> | undefined {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

function makeUser(input: CreateUserInput): User {
	const id = `user-${crypto.randomUUID()}`;
	return {
		id,
		username: input.username,
		displayName: input.displayName?.trim() || input.username,
		email: input.email,
		avatarUrl: null,
		bio: null,
		role: 'user',
		preferences: { ...defaultPreferences },
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
}

function session(user: User): AuthSession {
	return {
		accessToken: `mock-access-token-${user.id}`,
		refreshToken: `mock-refresh-token-${user.id}`,
		user
	};
}

function priceHistory(cardId: string): CardPriceHistory {
	return {
		cardId,
		points: [
			{ date: '2026-03-01T00:00:00.000Z', price: 35.9, currency: 'EUR' },
			{ date: '2026-07-01T00:00:00.000Z', price: 42.5, currency: 'EUR' }
		]
	};
}

function boosterInventory(userId: string): BoosterInventory {
	const state = boosterReserve.get(userId) ?? {
		available: boosterCapacity,
		lastRechargeAt: Date.now()
	};
	const elapsed = Math.floor((Date.now() - state.lastRechargeAt) / rechargeMs);
	if (elapsed > 0 && state.available < boosterCapacity) {
		state.available = Math.min(boosterCapacity, state.available + elapsed);
		state.lastRechargeAt += elapsed * rechargeMs;
	}
	boosterReserve.set(userId, state);
	return {
		available: state.available,
		capacity: boosterCapacity,
		nextRechargeAt:
			state.available >= boosterCapacity
				? null
				: new Date(state.lastRechargeAt + rechargeMs).toISOString()
	};
}

export function createMockApiResponse({ path, method = 'GET', body }: MockApiRequest): Response {
	const url = new URL(path, 'http://mock-api.local');
	const { pathname } = url;
	const normalizedMethod = method.toUpperCase();

	if (normalizedMethod === 'POST' && pathname === '/auth/logout') return json(undefined, 204);
	if (normalizedMethod === 'POST' && pathname === '/auth/login') {
		const input = asObject(body);
		if (typeof input?.email !== 'string' || typeof input.password !== 'string')
			return error(422, 'L’adresse e-mail et le mot de passe sont requis.', 'VALIDATION_ERROR');
		return json(
			session(
				[...users.values()].find((candidate) => candidate.email === input.email) ??
					users.get('demo-user')!
			)
		);
	}
	if (normalizedMethod === 'POST' && pathname === '/users') {
		const input = asObject(body);
		if (
			typeof input?.username !== 'string' ||
			typeof input.email !== 'string' ||
			typeof input.password !== 'string'
		)
			return error(422, 'Les champs username, email et password sont requis.', 'VALIDATION_ERROR');
		if (
			[...users.values()].some(
				(user) => user.email === input.email || user.username === input.username
			)
		)
			return error(409, 'Un utilisateur possède déjà cet e-mail ou ce nom.', 'USER_ALREADY_EXISTS');
		const user = makeUser({
			username: input.username,
			email: input.email,
			password: input.password,
			displayName: typeof input.displayName === 'string' ? input.displayName : undefined
		});
		users.set(user.id, user);
		return json(user, 201);
	}
	if (normalizedMethod === 'GET' && pathname === '/users') {
		const excludedId = url.searchParams.get('excludeId');
		return json(
			[...users.values()].filter((user) => user.id !== excludedId && user.role === 'user')
		);
	}

	if (normalizedMethod === 'GET' && pathname === '/cards') {
		const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
		const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('pageSize') ?? 12)));
		const query = url.searchParams.get('q')?.trim().toLocaleLowerCase('fr-FR');
		const rarity = url.searchParams.get('rarity');
		const items = mockCards.filter(
			(card) =>
				(!query || card.title.toLocaleLowerCase('fr-FR').includes(query)) &&
				(!rarity || card.rarity === rarity)
		);
		return json({
			items: items.slice((page - 1) * pageSize, page * pageSize),
			meta: {
				page,
				pageSize,
				total: items.length,
				totalPages: Math.max(1, Math.ceil(items.length / pageSize))
			}
		});
	}
	if (normalizedMethod === 'GET' && pathname === '/collection') {
		const items = mockCards.filter((card) => card.ownedCount > 0);
		return json({
			items,
			meta: { page: 1, pageSize: items.length, total: items.length, totalPages: 1 }
		});
	}
	if (normalizedMethod === 'GET' && pathname === '/wishlists') {
		const userId = url.searchParams.get('userId') ?? 'demo-user';
		return json(
			(wishlists.get(userId) ?? []).map((registry) => ({
				...registry,
				opportunityCount: registry.cardIds.filter((cardId) =>
					Boolean(mockCards.find((card) => card.id === cardId)?.friendsWhoOwn.length)
				).length
			}))
		);
	}
	if (normalizedMethod === 'POST' && pathname === '/wishlists') {
		const input = asObject(body);
		const userId = typeof input?.userId === 'string' ? input.userId : 'demo-user';
		const title = typeof input?.title === 'string' ? input.title.trim() : '';
		const description = typeof input?.description === 'string' ? input.description.trim() : '';
		if (!title) return error(400, 'Titre requis.', 'WISHLIST_TITLE_REQUIRED');
		const registry: WishlistRegistry = {
			id: `desiderata-${Date.now()}`,
			userId,
			title,
			description,
			cardIds: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		wishlists.set(userId, [registry, ...(wishlists.get(userId) ?? [])]);
		return json(registry, 201);
	}
	if (normalizedMethod === 'GET' && pathname === '/messages/guild-wishlists') {
		return json(guildWishlistShares);
	}
	if (normalizedMethod === 'GET' && pathname === '/messages') {
		const userId = url.searchParams.get('userId') ?? 'demo-user';
		return json(
			conversations
				.filter((conversation) => conversation.participantIds.includes(userId))
				.toSorted((first, second) => second.updatedAt.localeCompare(first.updatedAt))
		);
	}
	const reactionMatch = /^\/messages\/reactions\/([^/]+)$/.exec(pathname);
	if (reactionMatch && normalizedMethod === 'PATCH') {
		const input = asObject(body);
		const userId = typeof input?.userId === 'string' ? input.userId : '';
		const emoji = typeof input?.emoji === 'string' ? input.emoji : '';
		const message = [...messages.values()]
			.flat()
			.find((entry) => entry.id === decodeURIComponent(reactionMatch[1]));
		if (!message) return error(404, 'Message introuvable.', 'MESSAGE_NOT_FOUND');
		if (!message.reactions) message.reactions = [];
		const reaction = message.reactions.find((entry) => entry.emoji === emoji);
		if (reaction?.userIds.includes(userId)) {
			reaction.userIds = reaction.userIds.filter((id) => id !== userId);
			if (!reaction.userIds.length)
				message.reactions = message.reactions.filter((entry) => entry !== reaction);
		} else if (reaction) reaction.userIds.push(userId);
		else message.reactions.push({ emoji, userIds: [userId] });
		return json(message);
	}
	const messageMatch = /^\/messages\/([^/]+)(?:\/(read))?$/.exec(pathname);
	if (messageMatch) {
		const [, encodedId, action] = messageMatch;
		const conversation = conversations.find((entry) => entry.id === decodeURIComponent(encodedId));
		if (!conversation) return error(404, 'Conversation introuvable.', 'CONVERSATION_NOT_FOUND');
		if (normalizedMethod === 'GET' && !action) return json(messages.get(conversation.id) ?? []);
		if (normalizedMethod === 'PATCH' && action === 'read') {
			conversation.unreadCount = 0;
			return json(conversation);
		}
		if (normalizedMethod === 'POST' && !action) {
			const input = asObject(body);
			const senderId = typeof input?.senderId === 'string' ? input.senderId : '';
			const content = typeof input?.content === 'string' ? input.content.trim() : '';
			if (!conversation.participantIds.includes(senderId) || !content)
				return error(422, 'Message invalide.', 'MESSAGE_VALIDATION_ERROR');
			const createdAt = new Date().toISOString();
			const message: MessageRecord = {
				id: `message-${crypto.randomUUID()}`,
				conversationId: conversation.id,
				senderId,
				content,
				createdAt,
				readAt: senderId === 'demo-user' ? createdAt : null,
				replyToMessageId:
					typeof input?.replyToMessageId === 'string' ? input.replyToMessageId : null,
				reactions: []
			};
			messages.set(conversation.id, [...(messages.get(conversation.id) ?? []), message]);
			conversation.preview = content;
			conversation.updatedAt = createdAt;
			return json(message, 201);
		}
	}
	if (normalizedMethod === 'POST' && pathname === '/wishlists/import') {
		const input = asObject(body);
		const userId = typeof input?.userId === 'string' ? input.userId : 'demo-user';
		const sealUrl = typeof input?.sealUrl === 'string' ? input.sealUrl : '';
		const match = /\/seals\/(.+)-\d+$/.exec(sealUrl);
		const source = match
			? [...wishlists.values()].flat().find((registry) => registry.id === match[1])
			: undefined;
		if (!source) return error(404, 'Lien de wishlist invalide.', 'WISHLIST_SEAL_NOT_FOUND');
		const imported: WishlistRegistry = {
			...source,
			id: `desiderata-${Date.now()}`,
			userId,
			title: source.title,
			cardIds: [...source.cardIds],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		wishlists.set(userId, [imported, ...(wishlists.get(userId) ?? [])]);
		return json(imported, 201);
	}
	const wishlistRegistryMatch = /^\/wishlists\/([^/]+)(?:\/(cards|remove|share))?$/.exec(pathname);
	if (wishlistRegistryMatch) {
		const [, encodedId, action] = wishlistRegistryMatch;
		const userId = url.searchParams.get('userId') ?? 'demo-user';
		const registries = wishlists.get(userId) ?? [];
		const registry = registries.find((entry) => entry.id === decodeURIComponent(encodedId));
		if (!registry) return error(404, 'Registre introuvable.', 'WISHLIST_NOT_FOUND');
		if (normalizedMethod === 'GET' && !action) return json(registry);
		if (normalizedMethod === 'DELETE' && !action) {
			wishlists.set(
				userId,
				registries.filter((entry) => entry !== registry)
			);
			return json(undefined, 204);
		}
		if (normalizedMethod === 'POST' && action === 'cards') {
			const cardId =
				typeof asObject(body)?.cardId === 'string' ? (asObject(body)!.cardId as string) : '';
			if (!mockCards.some((card) => card.id === cardId))
				return error(404, 'Carte introuvable.', 'CARD_NOT_FOUND');
			if (!registry.cardIds.includes(cardId)) registry.cardIds.push(cardId);
			registry.updatedAt = new Date().toISOString();
			return json(registry);
		}
		if (normalizedMethod === 'POST' && action === 'remove') {
			const cardId =
				typeof asObject(body)?.cardId === 'string' ? (asObject(body)!.cardId as string) : '';
			registry.cardIds = registry.cardIds.filter((entry) => entry !== cardId);
			registry.updatedAt = new Date().toISOString();
			return json(registry);
		}
		if (normalizedMethod === 'POST' && action === 'share') {
			if (asObject(body)?.target === 'guild') {
				const share: GuildWishlistShare = {
					id: `guild-share-${Date.now()}`,
					registryId: registry.id,
					title: registry.title,
					description: registry.description,
					cardCount: registry.cardIds.length,
					createdAt: new Date().toISOString()
				};
				guildWishlistShares.unshift(share);
				const createdAt = new Date().toISOString();
				const message: MessageRecord = {
					id: `message-${crypto.randomUUID()}`,
					conversationId: 'conversation-guild',
					senderId: userId,
					content: `Wishlist partagée : ${registry.title}`,
					createdAt,
					readAt: createdAt,
					reactions: [],
					wishlistShare: {
						registryId: registry.id,
						title: registry.title,
						description: registry.description,
						cardCount: registry.cardIds.length
					}
				};
				messages.set('conversation-guild', [
					...(messages.get('conversation-guild') ?? []),
					message
				]);
				const guildConversation = conversations.find((entry) => entry.id === 'conversation-guild');
				if (guildConversation) {
					guildConversation.preview = message.content;
					guildConversation.updatedAt = createdAt;
				}
			}
			return json({ sealUrl: `https://encyclomestre.test/seals/${registry.id}-${Date.now()}` });
		}
	}
	if (normalizedMethod === 'GET' && pathname === '/wishlist') {
		const userId = url.searchParams.get('userId') ?? 'demo-user';
		const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
		const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('pageSize') ?? 12)));
		const query = url.searchParams.get('q')?.trim().toLocaleLowerCase('fr-FR');
		const priority = url.searchParams.get('priority');
		const hasAlert = url.searchParams.get('hasAlert') === 'true';
		const entries = wishlist.get(userId) ?? [];
		const items = entries.filter((entry) => {
			const card = mockCards.find((candidate) => candidate.id === entry.cardId);
			const matchesQuery =
				!query ||
				card?.title.toLocaleLowerCase('fr-FR').includes(query) ||
				card?.shortDescription.toLocaleLowerCase('fr-FR').includes(query);
			const matchesPriority = !priority || entry.priority === priority;
			const matchesAlert =
				!hasAlert ||
				Boolean(card?.friendsWhoOwn.length) ||
				sales.some((sale) => sale.cardId === entry.cardId && sale.type === 'auction');
			return matchesQuery && matchesPriority && matchesAlert;
		});
		return json({
			items: items.slice((page - 1) * pageSize, page * pageSize),
			meta: {
				page,
				pageSize,
				total: items.length,
				totalPages: Math.max(1, Math.ceil(items.length / pageSize))
			}
		});
	}
	if (normalizedMethod === 'GET' && pathname === '/wishlist/alerts') {
		const entries = wishlist.get(url.searchParams.get('userId') ?? 'demo-user') ?? [];
		return json(
			entries.flatMap((entry) => {
				const card = mockCards.find((candidate) => candidate.id === entry.cardId);
				const friendAlert = card?.friendsWhoOwn.length
					? [
							{
								id: `friend-${entry.cardId}`,
								cardId: entry.cardId,
								type: 'friend-owner' as const,
								context: card.friendsWhoOwn[0].username,
								createdAt: now
							}
						]
					: [];
				const auctionAlert = sales.some(
					(sale) => sale.cardId === entry.cardId && sale.type === 'auction'
				)
					? [
							{
								id: `auction-${entry.cardId}`,
								cardId: entry.cardId,
								type: 'auction' as const,
								context: 'active',
								createdAt: now
							}
						]
					: [];
				return [...friendAlert, ...auctionAlert];
			})
		);
	}
	if (normalizedMethod === 'POST' && pathname === '/wishlist') {
		const input = asObject(body);
		const userId = typeof input?.userId === 'string' ? input.userId : 'demo-user';
		const cardId = typeof input?.cardId === 'string' ? input.cardId : '';
		if (!mockCards.some((card) => card.id === cardId))
			return error(404, 'Carte introuvable.', 'CARD_NOT_FOUND');
		const entries = wishlist.get(userId) ?? [];
		const entry = entries.find((candidate) => candidate.cardId === cardId) ?? {
			cardId,
			priority: 'medium' as const,
			note: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		if (!entries.includes(entry)) entries.push(entry);
		wishlist.set(userId, entries);
		return json(entry, 201);
	}
	const wishlistMatch = /^\/wishlist\/([^/]+)$/.exec(pathname);
	if (wishlistMatch) {
		const userId = url.searchParams.get('userId') ?? 'demo-user';
		const entries = wishlist.get(userId) ?? [];
		const entry = entries.find(
			(candidate) => candidate.cardId === decodeURIComponent(wishlistMatch[1])
		);
		if (!entry) return error(404, 'Entrée introuvable.', 'WISHLIST_NOT_FOUND');
		if (normalizedMethod === 'PATCH') {
			const input = asObject(body) ?? {};
			if (input.priority === 'low' || input.priority === 'medium' || input.priority === 'high')
				entry.priority = input.priority;
			if (typeof input.note === 'string' || input.note === null) entry.note = input.note;
			entry.updatedAt = new Date().toISOString();
			return json(entry);
		}
		if (normalizedMethod === 'DELETE') {
			wishlist.set(
				userId,
				entries.filter((candidate) => candidate !== entry)
			);
			return json(undefined, 204);
		}
	}
	if (normalizedMethod === 'GET' && pathname === '/boosters/inventory')
		return json(boosterInventory(url.searchParams.get('userId') ?? 'demo-user'));
	if (normalizedMethod === 'POST' && pathname === '/boosters/open') {
		const userId =
			typeof asObject(body)?.userId === 'string' ? (asObject(body)!.userId as string) : 'demo-user';
		const inventory = boosterInventory(userId);
		if (!inventory.available) return error(409, 'Aucun paquet disponible.', 'BOOSTER_EMPTY');
		const state = boosterReserve.get(userId)!;
		state.available -= 1;
		const pulls = Array.from({ length: 5 }, () => {
			const card = mockCards[Math.floor(Math.random() * mockCards.length)];
			const ownedBefore = card.ownedCount;
			card.ownedCount += 1;
			return { card, ownedBefore, ownedAfter: card.ownedCount };
		});
		const result: BoosterOpenResult = { pulls, inventory: boosterInventory(userId) };
		return json(result);
	}
	if (normalizedMethod === 'GET' && pathname === '/sales') {
		const sellerId = url.searchParams.get('sellerId');
		const cardId = url.searchParams.get('cardId');
		const query = url.searchParams.get('q')?.toLocaleLowerCase('fr-FR') ?? '';
		const type = url.searchParams.get('type');
		const maxPrice = Number(url.searchParams.get('maxPrice') ?? 0);
		const bidderId = url.searchParams.get('bidderId');
		return json(
			sales
				.filter(
					(sale) =>
						(!sellerId || sale.sellerId === sellerId) &&
						(!cardId || sale.cardId === cardId) &&
						(!bidderId ||
							saleBids.some((bid) => bid.saleId === sale.id && bid.bidderId === bidderId)) &&
						(!type || sale.type === type) &&
						(!maxPrice || sale.price <= maxPrice) &&
						(!query ||
							mockCards
								.find((card) => card.id === sale.cardId)
								?.title.toLocaleLowerCase('fr-FR')
								.includes(query) ||
							users.get(sale.sellerId)?.username.toLocaleLowerCase('fr-FR').includes(query))
				)
				.map((sale) => ({
					...sale,
					sellerName: users.get(sale.sellerId)?.username ?? sale.sellerId,
					status: 'active'
				}))
		);
	}
	const saleDetailMatch = /^\/sales\/([^/]+)(?:\/(bids))?$/.exec(pathname);
	if (saleDetailMatch && normalizedMethod === 'POST' && saleDetailMatch[2] === 'bids') {
		const sale = sales.find((entry) => entry.id === decodeURIComponent(saleDetailMatch[1]));
		const amount = Number(asObject(body)?.amount ?? 0);
		if (!sale || amount <= sale.price) return error(422, 'Mise invalide.', 'BID_INVALID');
		sale.price = amount;
		const bid: SaleBid = {
			id: `bid-${crypto.randomUUID()}`,
			saleId: sale.id,
			bidderId: 'demo-user',
			bidderName: 'collectionneur-demo',
			amount,
			createdAt: new Date().toISOString()
		};
		saleBids.push(bid);
		return json(bid, 201);
	}
	if (saleDetailMatch && normalizedMethod === 'GET') {
		const [, encodedId, resource] = saleDetailMatch;
		const sale = sales.find((entry) => entry.id === decodeURIComponent(encodedId));
		if (!sale) return error(404, 'Annonce introuvable.', 'SALE_NOT_FOUND');
		if (resource === 'bids')
			return json(saleBids.filter((bid) => bid.saleId === sale.id).toReversed());
		return json({
			...sale,
			sellerName: users.get(sale.sellerId)?.username ?? sale.sellerId,
			status: 'active'
		});
	}
	if (normalizedMethod === 'GET' && pathname === '/trades') {
		const userId = url.searchParams.get('userId');
		return json(
			userId
				? tradeOffers.filter(
						(offer) => offer.initiatorId === userId || offer.recipientId === userId
					)
				: tradeOffers
		);
	}
	if (normalizedMethod === 'POST' && pathname === '/trades') {
		const input = asObject(body) as CreateTradeOfferInput | undefined;
		if (
			!input ||
			typeof input.initiatorId !== 'string' ||
			typeof input.recipientId !== 'string' ||
			!Array.isArray(input.offeredCardIds) ||
			!Array.isArray(input.requestedCardIds) ||
			(!input.offeredCardIds.length &&
				!input.requestedCardIds.length &&
				!(input.offeredCredits || input.requestedCredits))
		)
			return error(
				422,
				'Une offre doit contenir des cartes et deux participants.',
				'VALIDATION_ERROR'
			);
		const createdAt = new Date().toISOString();
		const offer: TradeOffer = {
			id: `trade-${crypto.randomUUID()}`,
			initiatorId: input.initiatorId,
			recipientId: input.recipientId,
			offeredCardIds: input.offeredCardIds,
			requestedCardIds: input.requestedCardIds,
			offeredCredits: Math.max(0, Number(input.offeredCredits) || 0),
			requestedCredits: Math.max(0, Number(input.requestedCredits) || 0),
			status: 'pending',
			createdAt,
			updatedAt: createdAt
		};
		tradeOffers.unshift(offer);
		return json(offer, 201);
	}
	const tradeMatch = /^\/trades\/([^/]+)$/.exec(pathname);
	if (tradeMatch && normalizedMethod === 'PATCH') {
		const offer = tradeOffers.find((entry) => entry.id === decodeURIComponent(tradeMatch[1]));
		if (!offer) return error(404, 'Offre introuvable.', 'TRADE_NOT_FOUND');
		const status = asObject(body)?.status;
		if (
			offer.status !== 'pending' ||
			(status !== 'accepted' && status !== 'rejected' && status !== 'cancelled')
		)
			return error(
				422,
				'Cette réponse ne peut pas être appliquée à l’offre.',
				'TRADE_INVALID_STATUS'
			);
		offer.status = status;
		offer.updatedAt = new Date().toISOString();
		return json(offer);
	}
	const profileMatch = /^\/users\/([^/]+)\/profile$/.exec(pathname);
	if (profileMatch) {
		const id = decodeURIComponent(profileMatch[1]);
		if (!users.has(id)) return error(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
		const current = profileSettings.get(id) ?? {
			username: users.get(id)!.username,
			avatarCardId: null,
			accentColor: '#C19A6B',
			bioTags: [],
			showcases: [],
			wantedCardIds: [],
			nsfwEnabled: false,
			censoredKeywords: []
		};
		if (normalizedMethod === 'GET') return json(current);
		if (normalizedMethod === 'PATCH') {
			const input = asObject(body) ?? {};
			const next = { ...current, ...input } as ProfileSettings;
			profileSettings.set(id, next);
			return json(next);
		}
	}
	const profileSummaryMatch = /^\/users\/([^/]+)\/registry-summary$/.exec(pathname);
	if (profileSummaryMatch && normalizedMethod === 'GET') {
		const [, userId] = profileSummaryMatch;
		if (!users.has(decodeURIComponent(userId)))
			return error(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
		const id = decodeURIComponent(userId);
		const ownedCards = mockCards.filter((card) =>
			id === 'demo-user'
				? card.ownedCount > 0
				: card.friendsWhoOwn.some((friend) => friend.friendId === id)
		);
		return json({
			ownedCards: ownedCards.length,
			totalCopies: ownedCards.reduce((total, card) => total + card.ownedCount, 0),
			rareCards: ownedCards.filter((card) => card.rarity !== 'Commune').length,
			publicTags: mockCollectionTags
		});
	}
	const userCollectionMatch = /^\/users\/([^/]+)\/collection$/.exec(pathname);
	if (userCollectionMatch && normalizedMethod === 'GET') {
		const userId = decodeURIComponent(userCollectionMatch[1]);
		if (!users.has(userId)) return error(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
		return json(
			mockCards.filter((card) =>
				userId === 'demo-user'
					? card.ownedCount > 0
					: card.friendsWhoOwn.some((friend) => friend.friendId === userId)
			)
		);
	}
	const cardMatch = /^\/cards\/([^/]+)(?:\/(price-history))?$/.exec(pathname);
	if (cardMatch && normalizedMethod === 'GET') {
		const [, encodedId, resource] = cardMatch;
		const card = mockCards.find((candidate) => candidate.id === decodeURIComponent(encodedId));
		if (!card) return error(404, 'Carte introuvable.', 'CARD_NOT_FOUND');
		return resource === 'price-history' ? json(priceHistory(card.id)) : json(card);
	}

	const userMatch = /^\/users\/([^/]+)(?:\/(preferences))?$/.exec(pathname);
	if (normalizedMethod === 'GET' && pathname === '/friends') {
		return json(friendships.get(url.searchParams.get('userId') ?? 'demo-user') ?? []);
	}
	if (normalizedMethod === 'POST' && pathname === '/friends') {
		const input = asObject(body);
		const userId = typeof input?.userId === 'string' ? input.userId : 'demo-user';
		const recipientId = typeof input?.recipientId === 'string' ? input.recipientId : '';
		const recipient = users.get(recipientId);
		if (!recipient) return error(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
		const friendship: Friendship = {
			id: `friendship-${Date.now()}`,
			user: recipient,
			status: 'sent',
			createdAt: new Date().toISOString(),
			lastActiveAt: now
		};
		friendships.set(userId, [...(friendships.get(userId) ?? []), friendship]);
		return json(friendship, 201);
	}
	const friendshipMatch = /^\/friends\/([^/]+)$/.exec(pathname);
	if (friendshipMatch) {
		const id = decodeURIComponent(friendshipMatch[1]);
		for (const [userId, entries] of friendships) {
			const friendship = entries.find((entry) => entry.id === id);
			if (!friendship) continue;
			if (normalizedMethod === 'PATCH') {
				const status = asObject(body)?.status;
				if (status === 'accepted' || status === 'received') friendship.status = status;
				return json(friendship);
			}
			if (normalizedMethod === 'DELETE') {
				friendships.set(
					userId,
					entries.filter((entry) => entry.id !== id)
				);
				return json(undefined, 204);
			}
		}
		return error(404, 'Invitation introuvable.', 'FRIENDSHIP_NOT_FOUND');
	}
	if (userMatch) {
		const [, encodedId, resource] = userMatch;
		const user = users.get(decodeURIComponent(encodedId));
		if (!user) return error(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
		if (normalizedMethod === 'GET' && !resource) return json(user);
		if (normalizedMethod === 'PATCH' && !resource) {
			const input = asObject(body) as UpdateUserInput | undefined;
			if (!input)
				return error(422, 'Le corps de la requête doit être un objet.', 'VALIDATION_ERROR');
			const updated = { ...user, ...input, updatedAt: new Date().toISOString() };
			users.set(updated.id, updated);
			return json(updated);
		}
		if (normalizedMethod === 'DELETE' && !resource) {
			users.delete(user.id);
			profileSettings.delete(user.id);
			return json(undefined, 204);
		}
		if (normalizedMethod === 'PATCH' && resource === 'preferences') {
			const input = asObject(body) as UpdateUserPreferencesInput | undefined;
			if (!input)
				return error(422, 'Le corps de la requête doit être un objet.', 'VALIDATION_ERROR');
			const updated = {
				...user,
				preferences: { ...defaultPreferences, ...user.preferences, ...input },
				updatedAt: new Date().toISOString()
			};
			users.set(updated.id, updated);
			return json(updated);
		}
	}

	return error(
		404,
		`Aucune route mock ne correspond à ${normalizedMethod} ${pathname}.`,
		'MOCK_ROUTE_NOT_FOUND'
	);
}
