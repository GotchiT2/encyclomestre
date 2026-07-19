import type {
	AuthSession,
	CardRecord,
	CardPriceHistory,
	CreateUserInput,
	UpdateUserInput,
	UpdateUserPreferencesInput,
	User,
	SaleListing,
	ProfileSettings,
	TradeOffer,
	BoosterInventory,
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
const auctionSoon = new Date(Date.now() + 45_000).toISOString();
const auctionLater = new Date(Date.now() + 3_600_000).toISOString();
const auctionPast = new Date(Date.now() - 60_000).toISOString();
const apiCard = (card: CardRecord) => ({
	id: card.id,
	baseCardId: card.baseCardId ?? (Number.parseInt(card.id.replace(/\D/g, ''), 10) || 0),
	variant: card.isFullArt ? 'FULL_ART' : 'NORMAL',
	isFullArt: Boolean(card.isFullArt),
	wikipediaTitle: card.title,
	shortDescription: card.shortDescription,
	longDescription: card.longDescription,
	imageUrl: card.imageUrl,
	wikipediaUrl: card.wikipediaUrl,
	rarity: card.rarityInitials,
	category: card.category,
	atk: card.attack,
	def: card.defense,
	qScore: card.qScore,
	pageviews: card.viewCount,
	globalSupply: card.globalSupply,
	createdAt: now
});

const apiRegistry = (registry: WishlistRegistry) => ({
	...registry,
	cards: registry.cards.map(apiCard)
});
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
		userCardId: 'owned-girls-generation-1',
		price: 42.5,
		currency: 'EUR',
		type: 'auction',
		status: 'active',
		createdAt: now,
		endsAt: auctionSoon,
		closedAt: null
	},
	{
		id: 'sale-002',
		sellerId: 'demo-user',
		cardId: 'red-velvet-1',
		price: 65,
		currency: 'EUR',
		type: 'auction',
		status: 'cancelled',
		endsAt: auctionLater,
		closedAt: now
	},
	{
		id: 'sale-003',
		sellerId: 'friend-0',
		cardId: 'girls-generation-2',
		price: 54,
		currentPrice: 61,
		minimumBid: 68,
		bidCount: 3,
		currency: 'EUR',
		type: 'auction',
		status: 'sold',
		buyerId: 'demo-user',
		buyerName: 'collectionneur-demo',
		endsAt: auctionPast,
		closedAt: now
	},
	{
		id: 'sale-004',
		sellerId: 'friend-1',
		cardId: 'blackpink-1',
		price: 39,
		currency: 'EUR',
		type: 'auction',
		status: 'expired',
		endsAt: auctionPast,
		closedAt: now
	}
];

function activeSalePayload(userCardId: string) {
	const sale = sales.find(
		(entry) => entry.userCardId === userCardId && (entry.status ?? 'active') === 'active'
	);
	return sale
		? {
				id: sale.id,
				type: sale.type,
				status: sale.status ?? 'active',
				price: sale.price,
				currentPrice: sale.currentPrice ?? sale.price,
				minimumBid: sale.minimumBid ?? Math.ceil(sale.price * 1.1),
				endsAt: sale.endsAt ?? null
			}
		: null;
}
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
				card: mockCards.find((card) => card.id === 'red-velvet-1')!,
				priority: 'medium',
				note: 'Suivre la prochaine enchère.',
				createdAt: now,
				updatedAt: now
			},
			{
				cardId: 'blackpink-1',
				card: mockCards.find((card) => card.id === 'blackpink-1')!,
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
				title: 'Cartes prioritaires',
				description: 'Les cartes à obtenir en priorité.',
				isPublic: true,
				cardIds: ['girls-generation-1', 'blackpink-1', 'red-velvet-1'],
				cards: mockCards.filter((card) =>
					['girls-generation-1', 'blackpink-1', 'red-velvet-1'].includes(card.id)
				),
				createdAt: now,
				updatedAt: now
			},
			{
				id: 'desiderata-generation-2',
				userId: 'demo-user',
				title: 'Génération 2',
				description: 'Cartes de la seconde génération.',
				isPublic: false,
				cardIds: ['girls-generation-2', '2ne1-1', 'kara-groupe-1'],
				cards: mockCards.filter((card) =>
					['girls-generation-2', '2ne1-1', 'kara-groupe-1'].includes(card.id)
				),
				createdAt: now,
				updatedAt: now
			}
		]
	],
	[
		'friend-0',
		[
			{
				id: 'friend-0-public-wishlist',
				userId: 'friend-0',
				title: 'Cartes recherchées',
				description: 'Wishlist publique de SoneS9.',
				isPublic: true,
				cardIds: ['girls-generation-1', '2ne1-1'],
				cards: mockCards.filter((card) => ['girls-generation-1', '2ne1-1'].includes(card.id)),
				createdAt: now,
				updatedAt: now
			}
		]
	]
]);
const blockedUserIds = new Set<string>();
const guildWishlistShares: GuildWishlistShare[] = [];
const conversations: Conversation[] = [
	{
		id: 'conversation-guild',
		kind: 'guild',
		title: 'Guilde WikiForge',
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
					title: 'Cartes prioritaires',
					description: 'Les cartes à obtenir en priorité.',
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
const mockTradeParticipant = (id: string) => {
	const user = users.get(id);
	return {
		id,
		username: user?.username ?? id,
		displayName: user?.displayName ?? user?.username ?? id,
		avatarUrl: user?.avatarUrl ?? null
	};
};
const tradeOffers: TradeOffer[] = [
	{
		id: 'trade-001',
		initiatorId: 'friend-0',
		recipientId: 'demo-user',
		initiator: mockTradeParticipant('friend-0'),
		recipient: mockTradeParticipant('demo-user'),
		offeredCardIds: ['owned-friend-0-girls-generation-1'],
		requestedCardIds: ['owned-demo-user-2ne1-1'],
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
		initiator: mockTradeParticipant('demo-user'),
		recipient: mockTradeParticipant('friend-1'),
		offeredCardIds: ['owned-demo-user-girls-generation-1'],
		requestedCardIds: ['owned-friend-1-2ne1-1'],
		offeredCredits: 0,
		requestedCredits: 25,
		status: 'accepted',
		createdAt: '2026-07-01T08:00:00.000Z',
		updatedAt: '2026-07-02T09:30:00.000Z'
	},
	{
		id: 'trade-003',
		initiatorId: 'demo-user',
		recipientId: 'friend-2',
		initiator: mockTradeParticipant('demo-user'),
		recipient: mockTradeParticipant('friend-2'),
		offeredCardIds: ['owned-demo-user-girls-generation-1'],
		requestedCardIds: ['owned-friend-2-twice-groupe-1'],
		offeredCredits: 5,
		requestedCredits: 0,
		status: 'pending',
		createdAt: '2026-07-15T14:00:00.000Z',
		updatedAt: '2026-07-15T14:00:00.000Z'
	}
];
const apiTradeCards = (offer: TradeOffer) =>
	[
		...offer.offeredCardIds.map((userCardId) => ({ userCardId, side: 'offered' as const })),
		...offer.requestedCardIds.map((userCardId) => ({ userCardId, side: 'requested' as const }))
	].flatMap((entry) => {
		const card = mockCards.find((candidate) => entry.userCardId.endsWith(`-${candidate.id}`));
		return card ? [{ ...entry, card: apiCard(card) }] : [];
	});
const apiTradeOffer = (offer: TradeOffer) => ({
	id: offer.id,
	initiatorId: offer.initiatorId,
	recipientId: offer.recipientId,
	initiator: offer.initiator,
	recipient: offer.recipient,
	status: offer.status,
	offeredUserCardIds: offer.offeredCardIds,
	requestedUserCardIds: offer.requestedCardIds,
	cards: apiTradeCards(offer),
	offeredCredits: offer.offeredCredits,
	requestedCredits: offer.requestedCredits,
	createdAt: offer.createdAt
});
const profileSettings = new Map<string, ProfileSettings>([
	[
		'demo-user',
		{
			username: 'collectionneur-demo',
			avatarCardId: null,
			accentColor: '#feb823',
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
		bio: 'Collectionneur de cartes.',
		role: 'user',
		preferences: { ...defaultPreferences },
		createdAt: '2025-01-01T00:00:00.000Z',
		updatedAt: now
	});
}

profileSettings.set('friend-0', {
	username: 'SoneS9',
	avatarCardId: 'girls-generation-2',
	accentColor: '#feb823',
	bioTags: ['collection', 'generation-2'],
	showcases: [
		{
			id: 'friend-0-gallery-1',
			title: 'Cartes favorites',
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
	accentColor: '#b41dcf',
	bioTags: ['vocal', 'full-art'],
	showcases: [
		{
			id: 'friend-1-gallery-1',
			title: 'Sélection principale',
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
	const requestUrl = new URL(path, 'http://mock-api.local');
	const routedPath = requestUrl.pathname.replace(/^\/api(?=\/)/, '');
	const url = new URL(`${routedPath}${requestUrl.search}`, requestUrl.origin);
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
		const excludeCurrent = url.searchParams.get('excludeCurrent') === 'true';
		const query = url.searchParams.get('q')?.trim().toLocaleLowerCase('fr-FR') ?? '';
		const page = Math.max(0, Number(url.searchParams.get('page') ?? 0));
		const size = Math.max(1, Math.min(100, Number(url.searchParams.get('size') ?? 20)));
		const items = [...users.values()].filter(
			(user) =>
				user.role === 'user' &&
				user.id !== excludedId &&
				(!excludeCurrent || user.id !== 'demo-user') &&
				(!query || user.username.toLocaleLowerCase('fr-FR').includes(query))
		);
		return json({
			results: items.slice(page * size, (page + 1) * size),
			page,
			nbResults: items.length,
			size,
			sortBy: 'name',
			sortDirection: 'ASC',
			filters: { excludeCurrent },
			q: query || null
		});
	}

	if (normalizedMethod === 'GET' && pathname === '/cards') {
		const page = Math.max(0, Number(url.searchParams.get('page') ?? 0));
		const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('size') ?? 20)));
		const query = url.searchParams.get('q')?.trim().toLocaleLowerCase('fr-FR');
		const rarities = url.searchParams.getAll('rarity');
		const variant = url.searchParams.get('variant') ?? 'ALL';
		const items = mockCards.filter(
			(card) =>
				(!query || card.title.toLocaleLowerCase('fr-FR').includes(query)) &&
				(!rarities.length || rarities.includes(card.rarityInitials)) &&
				(variant === 'ALL' ||
					(variant === 'FULL_ART' && card.isFullArt) ||
					(variant === 'NORMAL' && !card.isFullArt))
		);
		return json({
			results: items.slice(page * pageSize, (page + 1) * pageSize).map(apiCard),
			page,
			nbResults: items.length,
			size: pageSize,
			sortBy: url.searchParams.get('sortBy') ?? 'name',
			sortDirection: url.searchParams.get('sortDirection') ?? 'ASC',
			filters: { rarity: rarities, variant },
			q: query ?? null
		});
	}
	if (normalizedMethod === 'GET' && pathname === '/collection') {
		const page = Math.max(0, Number(url.searchParams.get('page') ?? 0));
		const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('size') ?? 20)));
		const variant = url.searchParams.get('variant') ?? 'ALL';
		const saleState = url.searchParams.get('saleState') ?? 'ALL';
		const items = mockCards.filter(
			(card) =>
				card.ownedCount > 0 &&
				(saleState === 'ALL' ||
					(saleState === 'ACTIVE' && Boolean(activeSalePayload(`owned-${card.id}`))) ||
					(saleState === 'AVAILABLE' && !activeSalePayload(`owned-${card.id}`))) &&
				(variant === 'ALL' ||
					(variant === 'FULL_ART' && card.isFullArt) ||
					(variant === 'NORMAL' && !card.isFullArt))
		);
		return json({
			results: items.slice(page * pageSize, (page + 1) * pageSize).map((card) => ({
				userCardId: `owned-${card.id}`,
				cardId: card.id,
				acquiredAt: card.acquiredAt ?? now,
				tags: card.collectionTags ?? [],
				card: apiCard(card),
				activeSale: activeSalePayload(`owned-${card.id}`)
			})),
			page,
			nbResults: items.length,
			size: pageSize
		});
	}
	const variantCopiesMatch = /^\/collection\/variants\/([^/]+)\/copies$/.exec(pathname);
	if (normalizedMethod === 'GET' && variantCopiesMatch) {
		const variantId = decodeURIComponent(variantCopiesMatch[1]);
		const card = mockCards.find((entry) => entry.id === variantId);
		if (!card || card.ownedCount < 1) return json([]);
		return json(
			Array.from({ length: card.ownedCount }, (_, index) => {
				const userCardId = index === 0 ? `owned-${card.id}` : `owned-${card.id}-${index + 1}`;
				return {
					userCardId,
					cardId: card.id,
					acquiredAt: card.acquiredAt ?? now,
					tags: card.collectionTags ?? [],
					card: apiCard(card),
					activeSale: activeSalePayload(userCardId)
				};
			})
		);
	}
	if (normalizedMethod === 'GET' && pathname === '/wishlists') {
		const userId = url.searchParams.get('userId') ?? 'demo-user';
		return json(
			(wishlists.get(userId) ?? []).map((registry) => ({
				...apiRegistry(registry),
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
			isPublic: input?.isPublic === true,
			cardIds: [],
			cards: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		wishlists.set(userId, [registry, ...(wishlists.get(userId) ?? [])]);
		return json(apiRegistry(registry), 201);
	}
	if (normalizedMethod === 'GET' && pathname === '/messages/guild-wishlists') {
		return json(guildWishlistShares);
	}
	if (normalizedMethod === 'GET' && pathname === '/messages') {
		const userId = url.searchParams.get('userId') ?? 'demo-user';
		return json(
			conversations
				.filter(
					(conversation) =>
						conversation.participantIds.includes(userId) &&
						!conversation.participantIds.some((id) => blockedUserIds.has(id))
				)
				.toSorted((first, second) => second.updatedAt.localeCompare(first.updatedAt))
		);
	}
	if (
		normalizedMethod === 'POST' &&
		(pathname === '/api/conversations/direct' || pathname === '/conversations/direct')
	) {
		const participantId = asObject(body)?.participantId;
		if (typeof participantId !== 'string' || !users.has(participantId))
			return error(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
		if (blockedUserIds.has(participantId))
			return error(403, 'Cet utilisateur est bloqué.', 'USER_BLOCKED');
		const existing = conversations.find(
			(conversation) =>
				conversation.kind === 'direct' &&
				conversation.participantIds.includes('demo-user') &&
				conversation.participantIds.includes(participantId)
		);
		if (existing) return json(existing);
		const participant = users.get(participantId)!;
		const conversation: Conversation = {
			id: `conversation-${participantId}`,
			kind: 'direct',
			title: participant.displayName || participant.username,
			participantIds: ['demo-user', participantId],
			preview: '',
			unreadCount: 0,
			updatedAt: new Date().toISOString()
		};
		conversations.unshift(conversation);
		messages.set(conversation.id, []);
		return json(conversation);
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
		const userId = 'demo-user';
		const token = url.searchParams.get('token') ?? '';
		const source = [...wishlists.values()].flat().find((registry) => registry.id === token);
		if (!source) return error(404, 'Lien de wishlist invalide.', 'WISHLIST_SEAL_NOT_FOUND');
		const imported: WishlistRegistry = {
			...source,
			id: `desiderata-${Date.now()}`,
			userId,
			title: source.title,
			isPublic: false,
			cardIds: [...source.cardIds],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		wishlists.set(userId, [imported, ...(wishlists.get(userId) ?? [])]);
		return json(apiRegistry(imported), 201);
	}
	const wishlistRegistryMatch = /^\/wishlists\/([^/]+)(?:\/(cards|remove|share))?$/.exec(pathname);
	if (wishlistRegistryMatch) {
		const [, encodedId, action] = wishlistRegistryMatch;
		const userId = url.searchParams.get('userId') ?? 'demo-user';
		const registries = wishlists.get(userId) ?? [];
		const registry = registries.find((entry) => entry.id === decodeURIComponent(encodedId));
		if (!registry) return error(404, 'Wishlist introuvable.', 'WISHLIST_NOT_FOUND');
		if (normalizedMethod === 'GET' && !action) return json(apiRegistry(registry));
		if (normalizedMethod === 'PATCH' && !action) {
			const input = asObject(body) ?? {};
			if (typeof input.title === 'string' && input.title.trim())
				registry.title = input.title.trim();
			if (typeof input.description === 'string') registry.description = input.description;
			if (typeof input.isPublic === 'boolean') registry.isPublic = input.isPublic;
			registry.updatedAt = new Date().toISOString();
			return json(apiRegistry(registry));
		}
		if (normalizedMethod === 'GET' && action === 'cards') return json(registry.cards.map(apiCard));
		if (normalizedMethod === 'DELETE' && !action) {
			wishlists.set(
				userId,
				registries.filter((entry) => entry !== registry)
			);
			return json(undefined, 204);
		}
		if (normalizedMethod === 'POST' && action === 'cards') {
			const cardId = url.searchParams.get('cardId') ?? '';
			if (!mockCards.some((card) => card.id === cardId))
				return error(404, 'Carte introuvable.', 'CARD_NOT_FOUND');
			if (!registry.cardIds.includes(cardId)) registry.cardIds.push(cardId);
			const card = mockCards.find((entry) => entry.id === cardId);
			if (card && !registry.cards.some((entry) => entry.id === cardId)) registry.cards.push(card);
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
			return json({ token: registry.id });
		}
	}
	const wishlistRegistryCardMatch = /^\/wishlists\/([^/]+)\/cards\/([^/]+)$/.exec(pathname);
	if (wishlistRegistryCardMatch && normalizedMethod === 'DELETE') {
		const [, encodedId, encodedCardId] = wishlistRegistryCardMatch;
		const registries = wishlists.get('demo-user') ?? [];
		const registry = registries.find((entry) => entry.id === decodeURIComponent(encodedId));
		if (!registry) return error(404, 'Wishlist introuvable.', 'WISHLIST_NOT_FOUND');
		const cardId = decodeURIComponent(encodedCardId);
		registry.cardIds = registry.cardIds.filter((entry) => entry !== cardId);
		registry.cards = registry.cards.filter((entry) => entry.id !== cardId);
		registry.updatedAt = new Date().toISOString();
		return json(undefined, 204);
	}
	if (normalizedMethod === 'GET' && pathname === '/wishlist') {
		const userId = url.searchParams.get('userId') ?? 'demo-user';
		const page = Math.max(0, Number(url.searchParams.get('page') ?? 0));
		const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('size') ?? 20)));
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
			results: items.slice(page * pageSize, (page + 1) * pageSize).map((entry) => ({
				...entry,
				card: apiCard(entry.card),
				hasAlert:
					Boolean(entry.card.friendsWhoOwn.length) ||
					sales.some((sale) => sale.cardId === entry.cardId && sale.type === 'auction')
			})),
			page,
			nbResults: items.length,
			size: pageSize,
			sortBy: url.searchParams.get('sortBy') ?? 'name',
			sortDirection: url.searchParams.get('sortDirection') ?? 'ASC',
			filters: {},
			q: query ?? null
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
								message: card.friendsWhoOwn[0].username,
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
								message: 'active',
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
			card: mockCards.find((card) => card.id === cardId)!,
			priority: 'medium' as const,
			note: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		if (!entries.includes(entry)) entries.push(entry);
		wishlist.set(userId, entries);
		return json({ ...entry, card: apiCard(entry.card), hasAlert: false }, 201);
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
			return json({ ...entry, card: apiCard(entry.card), hasAlert: false });
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
	if (normalizedMethod === 'GET' && pathname === '/boosters/status') {
		const inventory = boosterInventory('demo-user');
		return json({
			availableBoosters: inventory.available,
			maxBoosters: inventory.capacity,
			nextBoosterAvailableAt: inventory.nextRechargeAt
		});
	}
	if (normalizedMethod === 'POST' && pathname === '/boosters/open') {
		const userId =
			typeof asObject(body)?.userId === 'string' ? (asObject(body)!.userId as string) : 'demo-user';
		const inventory = boosterInventory(userId);
		if (!inventory.available) return error(409, 'Aucun paquet disponible.', 'BOOSTER_EMPTY');
		const state = boosterReserve.get(userId)!;
		state.available -= 1;
		const cards = Array.from({ length: 5 }, (_, index) => {
			const card = mockCards[Math.floor(Math.random() * mockCards.length)];
			card.ownedCount += 1;
			return {
				userCardId: `booster-${Date.now()}-${index}`,
				cardId: card.id,
				acquiredAt: new Date().toISOString(),
				tags: [],
				card: apiCard(card)
			};
		});
		return json({ cards });
	}
	if (normalizedMethod === 'GET' && pathname === '/sales') {
		const sellerId = url.searchParams.get('sellerId');
		const cardId = url.searchParams.get('cardId');
		const query = url.searchParams.get('q')?.toLocaleLowerCase('fr-FR') ?? '';
		const bidderId = url.searchParams.get('bidderId');
		const results = sales
			.filter(
				(sale) =>
					!blockedUserIds.has(sale.sellerId) &&
					(!sellerId || sale.sellerId === sellerId) &&
					(!cardId || sale.cardId === cardId) &&
					(!bidderId ||
						saleBids.some((bid) => bid.saleId === sale.id && bid.bidderId === bidderId)) &&
					(!query ||
						mockCards
							.find((card) => card.id === sale.cardId)
							?.title.toLocaleLowerCase('fr-FR')
							.includes(query) ||
						users.get(sale.sellerId)?.username.toLocaleLowerCase('fr-FR').includes(query))
			)
			.map((sale) => ({
				...sale,
				card: apiCard(mockCards.find((card) => card.id === sale.cardId)!),
				sellerName: users.get(sale.sellerId)?.username ?? sale.sellerId
			}));
		return json({
			results,
			page: 0,
			nbResults: results.length,
			size: 100,
			filters: {},
			q: query || null
		});
	}
	if (normalizedMethod === 'POST' && pathname === '/sales') {
		const input = asObject(body);
		const userCardId = typeof input?.userCardId === 'string' ? input.userCardId : '';
		const type = input?.type === 'auction' || input?.type === 'direct' ? input.type : null;
		const price = Number(input?.price);
		const durationMinutes = Number(input?.durationMinutes);
		if (!userCardId || !type || !Number.isInteger(price) || price < 1 || price > 999999)
			return error(422, 'Paramètres de vente invalides.', 'SALE_INVALID');
		if (
			(type === 'auction' && ![1, 10, 60, 180, 360, 720, 1440].includes(durationMinutes)) ||
			(type === 'direct' && input?.durationMinutes !== undefined)
		)
			return error(422, 'Durée de vente invalide.', 'SALE_DURATION_INVALID');
		if (activeSalePayload(userCardId))
			return error(409, 'Cet exemplaire est déjà en vente.', 'SALE_ALREADY_ACTIVE');
		const card = mockCards
			.toSorted((left, right) => right.id.length - left.id.length)
			.find(
				(entry) => userCardId === `owned-${entry.id}` || userCardId.startsWith(`owned-${entry.id}-`)
			);
		if (!card) return error(404, 'Exemplaire introuvable.', 'USER_CARD_NOT_FOUND');
		const cardId = card.id;
		const createdAt = new Date().toISOString();
		const sale: SaleListing = {
			id: `sale-${crypto.randomUUID()}`,
			sellerId: 'demo-user',
			sellerName: users.get('demo-user')?.username,
			cardId,
			userCardId,
			card,
			price,
			currentPrice: price,
			minimumBid: Math.ceil(price * 1.1),
			currency: 'CREDITS',
			type,
			bidCount: 0,
			status: 'active',
			createdAt,
			endsAt:
				type === 'auction' ? new Date(Date.now() + durationMinutes * 60_000).toISOString() : null,
			closedAt: null
		};
		sales.unshift(sale);
		return json({ ...sale, card: apiCard(card) }, 201);
	}
	const saleDetailMatch = /^\/sales\/([^/]+)(?:\/(bids))?$/.exec(pathname);
	if (saleDetailMatch && normalizedMethod === 'DELETE' && !saleDetailMatch[2]) {
		const sale = sales.find((entry) => entry.id === decodeURIComponent(saleDetailMatch[1]));
		if (!sale) return error(404, 'Annonce introuvable.', 'SALE_NOT_FOUND');
		sale.status = 'cancelled';
		sale.closedAt = new Date().toISOString();
		return json(undefined, 204);
	}
	if (saleDetailMatch && normalizedMethod === 'POST' && saleDetailMatch[2] === 'bids') {
		const sale = sales.find((entry) => entry.id === decodeURIComponent(saleDetailMatch[1]));
		const amount = Number(asObject(body)?.amount ?? 0);
		if (!sale || amount < (sale.minimumBid ?? Math.ceil((sale.currentPrice ?? sale.price) * 1.1)))
			return error(422, 'Mise invalide.', 'BID_INVALID');
		sale.currentPrice = amount;
		sale.minimumBid = Math.ceil(amount * 1.1);
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
			card: apiCard(mockCards.find((card) => card.id === sale.cardId)!),
			sellerName: users.get(sale.sellerId)?.username ?? sale.sellerId
		});
	}
	const tradePathname = pathname.replace(/^\/api(?=\/trades(?:\/|$))/, '');
	if (normalizedMethod === 'GET' && tradePathname === '/trades/received') {
		return json(
			tradeOffers
				.filter(
					(offer) =>
						offer.recipientId === 'demo-user' &&
						offer.status === 'pending' &&
						!blockedUserIds.has(offer.initiatorId)
				)
				.map(apiTradeOffer)
		);
	}
	if (normalizedMethod === 'GET' && tradePathname === '/trades/sended') {
		return json(
			tradeOffers
				.filter((offer) => offer.initiatorId === 'demo-user' && offer.status === 'pending')
				.map(apiTradeOffer)
		);
	}
	if (normalizedMethod === 'GET' && tradePathname === '/trades/history') {
		return json(
			tradeOffers
				.filter(
					(offer) =>
						offer.status !== 'pending' &&
						(offer.initiatorId === 'demo-user' || offer.recipientId === 'demo-user')
				)
				.map(apiTradeOffer)
		);
	}
	if (normalizedMethod === 'POST' && tradePathname === '/trades') {
		const input = asObject(body);
		if (typeof input?.recipientId === 'string' && blockedUserIds.has(input.recipientId))
			return error(403, 'Cet utilisateur est bloqué.', 'USER_BLOCKED');
		if (
			!input ||
			typeof input.recipientId !== 'string' ||
			!Array.isArray(input.offeredUserCardIds) ||
			!Array.isArray(input.requestedUserCardIds) ||
			(!input.offeredUserCardIds.length &&
				!input.requestedUserCardIds.length &&
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
			initiatorId: 'demo-user',
			recipientId: input.recipientId,
			initiator: mockTradeParticipant('demo-user'),
			recipient: mockTradeParticipant(input.recipientId),
			offeredCardIds: input.offeredUserCardIds as string[],
			requestedCardIds: input.requestedUserCardIds as string[],
			offeredCredits: Math.max(0, Number(input.offeredCredits) || 0),
			requestedCredits: Math.max(0, Number(input.requestedCredits) || 0),
			status: 'pending',
			createdAt,
			updatedAt: createdAt
		};
		tradeOffers.unshift(offer);
		return json(apiTradeOffer(offer));
	}
	const tradeCardsMatch = /^\/trades\/([^/]+)\/cards$/.exec(tradePathname);
	if (tradeCardsMatch && normalizedMethod === 'GET') {
		const offer = tradeOffers.find((entry) => entry.id === decodeURIComponent(tradeCardsMatch[1]));
		if (!offer) return error(404, 'Offre introuvable.', 'TRADE_NOT_FOUND');
		return json(apiTradeCards(offer));
	}
	const tradeMatch = /^\/trades\/([^/]+)$/.exec(tradePathname);
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
		return json(apiTradeOffer(offer));
	}
	const publicWishlistMatch = /^\/users\/([^/]+)\/wishlists$/.exec(pathname);
	if (publicWishlistMatch && normalizedMethod === 'GET') {
		const ownerId = decodeURIComponent(publicWishlistMatch[1]);
		if (!users.has(ownerId)) return error(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
		return json(
			(wishlists.get(ownerId) ?? [])
				.filter((registry) => registry.isPublic)
				.map((registry) => ({
					id: registry.id,
					userId: registry.userId,
					title: registry.title,
					description: registry.description,
					cards: registry.cards.map((card) => ({
						card: apiCard(card),
						viewerOwnedCount: card.ownedCount,
						viewerUserCardIds: Array.from({ length: card.ownedCount }, (_, index) =>
							index === 0 ? `owned-${card.id}` : `owned-${card.id}-${index + 1}`
						)
					})),
					updatedAt: registry.updatedAt
				}))
		);
	}
	if (normalizedMethod === 'GET' && pathname === '/users/me/blocks') {
		return json(
			[...blockedUserIds].flatMap((id) => {
				const user = users.get(id);
				return user ? [{ user, createdAt: now }] : [];
			})
		);
	}
	const userBlockMatch = /^\/users\/([^/]+)\/block$/.exec(pathname);
	if (userBlockMatch) {
		const id = decodeURIComponent(userBlockMatch[1]);
		const user = users.get(id);
		if (!user) return error(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
		if (normalizedMethod === 'PUT') {
			blockedUserIds.add(id);
			return json({ user, createdAt: new Date().toISOString() });
		}
		if (normalizedMethod === 'DELETE') {
			blockedUserIds.delete(id);
			return json(undefined, 204);
		}
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
		const cards = mockCards.filter((card) =>
			userId === 'demo-user'
				? card.ownedCount > 0
				: card.friendsWhoOwn.some((friend) => friend.friendId === userId)
		);
		return json({
			results: cards.map((card) => ({
				userCardId: `owned-${userId}-${card.id}`,
				cardId: card.id,
				acquiredAt: card.acquiredAt ?? now,
				tags: card.collectionTags ?? [],
				card: apiCard(card)
			})),
			page: 0,
			nbResults: cards.length,
			size: 100
		});
	}
	if (normalizedMethod === 'GET' && pathname === '/cards/social-states') {
		return json(
			url.searchParams.getAll('cardId').flatMap((cardId) => {
				const card = mockCards.find((candidate) => candidate.id === cardId);
				if (!card) return [];
				const namedLists = (wishlists.get('demo-user') ?? [])
					.filter((registry) => registry.cardIds.includes(cardId))
					.map((registry) => ({ id: registry.id, title: registry.title, defaultList: false }));
				const inDefaultList = (wishlist.get('demo-user') ?? []).some(
					(entry) => entry.cardId === cardId
				);
				return [
					{
						cardId,
						ownedCount: card.ownedCount,
						wishlists: [
							...namedLists,
							...(inDefaultList ? [{ id: null, title: null, defaultList: true }] : [])
						],
						owners: card.friendsWhoOwn.map((owner) => ({
							userId: owner.friendId,
							username: owner.username,
							avatarUrl: owner.avatarUrl,
							ownedCount: owner.ownedCount
						}))
					}
				];
			})
		);
	}
	const cardMatch = /^\/cards\/([^/]+)(?:\/(price-history))?$/.exec(pathname);
	if (cardMatch && normalizedMethod === 'GET') {
		const [, encodedId, resource] = cardMatch;
		const card = mockCards.find((candidate) => candidate.id === decodeURIComponent(encodedId));
		if (!card) return error(404, 'Carte introuvable.', 'CARD_NOT_FOUND');
		return resource === 'price-history' ? json(priceHistory(card.id)) : json(apiCard(card));
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
				if (status === 'rejected') {
					friendships.set(
						userId,
						entries.filter((entry) => entry.id !== id)
					);
					return json({ ...friendship, status: 'rejected' });
				}
				if (status === 'accepted') friendship.status = status;
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
