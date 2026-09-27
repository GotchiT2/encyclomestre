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
	GuildWishlistShare,
	Friendship,
	Conversation,
	MessageRecord,
	SaleBid
} from '$lib/types';
import { mockCards, mockVariants } from './mocks/cards';
import { mockCollectionTags } from './mocks/collection-tags';
import { createAuctionMocks } from './mocks/auctions';
import { createCommunityMocks } from './mocks/community';

export interface MockApiRequest {
	path: string;
	method?: string;
	body?: unknown;
}

const now = '2026-07-11T09:00:00.000Z';
const mockNotifications = [
	{
		id: 990,
		type: 'AUCTION_OUTBID',
		extId: 70,
		read: false,
		creationDate: '2026-09-27T10:00:00',
		actor: { id: 2, name: 'Joueur' },
		meta: null
	},
	{
		id: 1,
		type: 'TRADE_RECEIVED',
		actor: { id: 2, name: 'Assassin Blanc', image: '/avatars/assassin-blanc.jpg' },
		extId: 12,
		meta: '{"price":540}',
		read: false,
		creationDate: now
	},
	{ id: 2, type: 'FRIEND_ACCEPTED', read: true, creationDate: '2026-07-10T09:00:00.000Z' }
];
const mockAchievements = [
	{
		code: 'collection_10',
		category: 'COLLECTION',
		name: 'Premières pages',
		description: 'Posséder 10 cartes',
		threshold: 10,
		progress: 10,
		rewardMoney: 100,
		unlockedAt: '2026-09-14T18:22:31'
	},
	{
		code: 'boosters_100',
		category: 'BOOSTER',
		name: 'Habitué du kiosque',
		description: 'Ouvrir 100 boosters',
		threshold: 100,
		progress: 32,
		rewardMoney: 0,
		rewardBoosters: { PREMIUM: 1 }
	},
	{
		code: 'trades_10',
		category: 'TRADE',
		name: 'Négociateur',
		threshold: 10,
		progress: 10,
		rewardMoney: 300,
		unlockedAt: '2026-09-10T18:22:31',
		claimedAt: '2026-09-10T18:22:40'
	}
];

interface LegacyWishlistEntry {
	cardId: string;
	card: CardRecord;
	priority: 'low' | 'medium' | 'high';
	note: string | null;
	createdAt: string;
	updatedAt: string;
}

interface LegacyWishlistRegistry {
	sharedWithGuild?: boolean;
	id: string;
	userId: string;
	title: string;
	description: string;
	isPublic: boolean;
	cardIds: string[];
	cards: CardRecord[];
	createdAt: string;
	updatedAt: string;
	imagePageId?: number | null;
	imageUrl?: string | null;
}
const auctionSoon = new Date(Date.now() + 45_000).toISOString();
const auctionLater = new Date(Date.now() + 3_600_000).toISOString();
const auctionPast = new Date(Date.now() - 60_000).toISOString();
const apiCard = (card: CardRecord) => ({
	id: Number.parseInt(card.id.replace(/\D/g, ''), 10) || 1,
	pageId: card.baseCardId ?? 1,
	title: card.title,
	description: card.longDescription || card.shortDescription,
	image: card.imageUrl,
	variantId: card.variantId,
	packId: card.packId ?? 1,
	serialNumber: card.serialNumber,
	maxCopies: card.maxCopies,
	atk: card.attack,
	ownedCount: card.ownedCount,
	creationDate: now
});
const publicPage = (card: CardRecord) => ({
	id: card.baseCardId ?? (Number.parseInt(card.id.replace(/\D/g, ''), 10) || 0),
	title: card.title,
	description: card.longDescription || card.shortDescription,
	image: card.imageUrl,
	atk: card.attack,
	defaultVariantId: card.variantId,
	variantIds: [1, 2, 3, 4],
	createdAt: card.acquiredAt ?? now,
	globalCount: card.globalSupply,
	ownedCount: card.ownedCount,
	...(card.friendsWhoOwn.length
		? {
				friends: card.friendsWhoOwn.map((friend) => ({
					id: wikiForgeUserId(friend.friendId),
					name: friend.username,
					nbCards: friend.ownedCount
				}))
			}
		: {})
});

const wikiForgeUserId = (id: string) =>
	id === 'demo-user' ? 1 : (Number.parseInt(id.match(/\d+$/)?.[0] ?? '0', 10) || 0) + 2;
const userByWikiForgeId = (id: string) =>
	[...users.values()].find((user) => String(wikiForgeUserId(user.id)) === id);
const simpleWikiForgeUser = (user: User) => ({
	id: wikiForgeUserId(user.id),
	name: user.username,
	image: null,
	lastConnection:
		user.lastConnection ??
		(user.id === 'demo-user'
			? 'TODAY'
			: wikiForgeUserId(user.id) % 3 === 0
				? 'THIS_MONTH'
				: 'THIS_WEEK'),
	sharesWishlist: user.id === 'friend-0'
});
const collectionCard = (card: CardRecord, id: number) => ({
	id,
	pageId: card.baseCardId ?? id,
	title: card.title,
	description: card.longDescription || card.shortDescription,
	image: card.imageUrl,
	variantId: card.variantId,
	packId: card.packId ?? 1,
	serialNumber: card.serialNumber,
	maxCopies: card.maxCopies,
	atk: card.attack,
	duplicate: card.ownedCount > 1,
	protected: Boolean(card.userProtected),
	tagIds: card.collectionTagIds?.map(Number) ?? [],
	acquiredDate: card.acquiredAt ?? now,
	creationDate: now,
	pendingTradeId: null,
	ownedCount: card.ownedCount
});
const showcaseCard = (card: CardRecord, id: number) => ({
	id,
	pageId: card.baseCardId ?? id,
	title: card.title,
	description: card.longDescription || card.shortDescription,
	image: card.imageUrl,
	nsfw: Boolean(card.nsfw),
	variantId: card.variantId,
	packId: card.packId ?? 1,
	serialNumber: card.serialNumber,
	maxCopies: card.maxCopies,
	atk: card.attack
});

let mockShowcaseLines = [
	{
		title: 'Mes préférées',
		cards: mockCards.slice(0, 2).map((card, index) => showcaseCard(card, index + 1))
	}
];
let mockShowcaseSlots = 3;
let nextInstantSaleId = 50;
const auctionMocks = createAuctionMocks(
	mockCards.map((card, index) => showcaseCard(card, index + 1))
);
const communityMocks = createCommunityMocks(
	mockCards.map((card, index) => showcaseCard(card, index + 1)),
	[...new Map(mockCards.map((card) => [card.baseCardId, publicPage(card)])).values()]
);
const mockBanners = [
	{
		id: 1,
		title: 'Actualité',
		message: 'Les enchères sont maintenant disponibles.',
		level: 'INFO',
		link: '/market',
		startsAt: '2026-09-01T00:00:00'
	}
];
let mockInstantSales = [{ id: 41, price: 500, card: showcaseCard(mockCards[0], 1) }];

const apiRegistry = (registry: LegacyWishlistRegistry) => ({
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
const wishlist = new Map<string, LegacyWishlistEntry[]>([
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
const wishlists = new Map<string, LegacyWishlistRegistry[]>([
	[
		'demo-user',
		[
			{
				id: '101',
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
				id: '102',
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
				id: '201',
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
const wishlistFollowers = new Map<string, Array<{ id: number; name: string; accepted: boolean }>>([
	['101', [{ id: 2, name: 'SoneS9', accepted: true }]],
	['102', [{ id: 3, name: 'OnMyGhost', accepted: false }]]
]);
let pendingWishlistState: 'pending' | 'shared' | 'removed' = 'pending';
let sharedWishlistLeft = false;
const pendingWishlistRegistry: LegacyWishlistRegistry = {
	id: '301',
	userId: 'friend-1',
	title: 'Cartes cinéma',
	description: 'Invitation en attente.',
	isPublic: false,
	cardIds: mockCards.slice(0, 2).map((card) => card.id),
	cards: mockCards.slice(0, 2),
	createdAt: now,
	updatedAt: now
};
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
					registryId: '101',
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

const mockPackCatalogue = [
	{
		id: 1,
		slotId: 1,
		position: 1,
		family: 'NORMAL',
		name: 'daily',
		description: 'daily',
		image: '/images/booster.png',
		renderKey: 'standard',
		status: 'OPEN',
		nbCards: 5,
		openAll: true,
		drawGroups: [
			{
				count: 5,
				variants: [
					{ variantId: 1, dropRate: 0.95 },
					{ variantId: 2, dropRate: 0.05 }
				]
			}
		]
	},
	...[
		[2, 2, 1, 'PREMIUM', 'chrome', 'chrome', 4, 99, 198, 'OPEN'],
		[3, 3, 1, 'PREMIUM_PLUS', 'nebula', 'nebula', 9, 99, 198, 'OPEN'],
		[4, 3, 2, 'PREMIUM_PLUS', 'arcade', 'arcade', 11, 99, 198, 'UPCOMING'],
		[5, 3, 3, 'PREMIUM_PLUS', 'neon', 'neon', 5, 99, 198, 'UPCOMING'],
		[6, 3, 4, 'PREMIUM_PLUS', 'comics', 'comics', 14, 99, 0, 'EXHAUSTED']
	].map(
		([
			id,
			slotId,
			position,
			family,
			name,
			renderKey,
			variantId,
			maxCopies,
			remainingCopies,
			status
		]) => ({
			id,
			slotId,
			position,
			family,
			name,
			description: name,
			renderKey,
			status,
			...(id === 2 ? { startsAt: '2026-01-01T00:00:00Z', endsAt: '2027-01-01T00:00:00Z' } : {}),
			nbCards: 5,
			openAll: false,
			drawGroups: [
				{ count: 4, variants: [{ variantId: id === 2 ? 3 : 1, dropRate: 1 }] },
				{
					count: 1,
					variants: [
						{
							variantId,
							dropRate: 0.85,
							maxCopies,
							remainingCopies,
							pages: [
								{
									id: 5411,
									title: 'Soleil',
									image:
										'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/The_Sun_in_white_light.jpg/250px-The_Sun_in_white_light.jpg'
								},
								{ id: 5958, title: 'Wikipédia' }
							]
						}
					]
				}
			]
		})
	)
];
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
		id: '1',
		initiatorId: 'friend-0',
		recipientId: 'demo-user',
		initiator: mockTradeParticipant('friend-0'),
		recipient: mockTradeParticipant('demo-user'),
		offeredCardIds: ['owned-friend-0-girls-generation-1'],
		requestedCardIds: ['owned-demo-user-2ne1-1'],
		message: 'Une proposition pour compléter nos collections.',
		status: 'pending',
		createdAt: '2026-07-10T08:00:00.000Z',
		updatedAt: '2026-07-10T08:00:00.000Z'
	},
	{
		id: '2',
		initiatorId: 'demo-user',
		recipientId: 'friend-1',
		initiator: mockTradeParticipant('demo-user'),
		recipient: mockTradeParticipant('friend-1'),
		offeredCardIds: ['owned-demo-user-girls-generation-1'],
		requestedCardIds: ['owned-friend-1-2ne1-1'],
		status: 'accepted',
		createdAt: '2026-07-01T08:00:00.000Z',
		updatedAt: '2026-07-02T09:30:00.000Z'
	},
	{
		id: '3',
		initiatorId: 'demo-user',
		recipientId: 'friend-2',
		initiator: mockTradeParticipant('demo-user'),
		recipient: mockTradeParticipant('friend-2'),
		offeredCardIds: ['owned-demo-user-girls-generation-1'],
		requestedCardIds: ['owned-friend-2-twice-groupe-1'],
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
		const copyId =
			Math.abs(
				[...entry.userCardId].reduce((value, character) => value * 31 + character.charCodeAt(0), 7)
			) % 1_000_000;
		return card ? [{ card: collectionCard(card, copyId || 1), status: 'ADDED' }] : [];
	});
const apiTradeStatus = (status: TradeOffer['status']) => status.toUpperCase();
const apiTradeOffer = (offer: TradeOffer) => ({
	id: Number(offer.id),
	initiator: simpleWikiForgeUser(users.get(offer.initiatorId)!),
	recipient: simpleWikiForgeUser(users.get(offer.recipientId)!),
	status: apiTradeStatus(offer.status),
	message: offer.message ?? '',
	expiresAt:
		offer.expiresAt ?? new Date(Date.parse(offer.createdAt) + 7 * 86_400_000).toISOString(),
	creationDate: offer.createdAt,
	modificationDate: offer.updatedAt,
	offered: apiTradeCards({ ...offer, requestedCardIds: [] }),
	requested: apiTradeCards({ ...offer, offeredCardIds: [] }),
	offeredMoney: offer.offeredMoney ?? 0,
	requestedMoney: offer.requestedMoney ?? 0,
	originalOfferedMoney: offer.originalOfferedMoney ?? offer.offeredMoney ?? 0,
	originalRequestedMoney: offer.originalRequestedMoney ?? offer.requestedMoney ?? 0
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
			censoredKeywords: [],
			visibility: 'FRIENDS',
			mutedNotifications: []
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
	censoredKeywords: [],
	visibility: 'FRIENDS',
	mutedNotifications: []
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
	censoredKeywords: [],
	visibility: 'PUBLIC',
	mutedNotifications: []
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
	},
	{
		id: 'friendship-003',
		user: { ...users.get('friend-2')! },
		status: 'sent',
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

function asForm(value: unknown): Record<string, string> | undefined {
	return value instanceof URLSearchParams ? Object.fromEntries(value.entries()) : undefined;
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

function oauthTokens(user: User) {
	return {
		access_token: `mock-access-token-${user.id}`,
		refresh_token: `mock-refresh-token-${user.id}`,
		token_type: 'Bearer',
		expires_in: 3600
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

function boosterInventory(userId: string): {
	available: number;
	capacity: number;
	nextRechargeAt: string | null;
} {
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

function mockBoostersPayload(inventory: ReturnType<typeof boosterInventory>) {
	return {
		families: [
			{
				family: 'NORMAL',
				available: inventory.available,
				max: inventory.capacity,
				bonus: 1,
				nextAvailableAt: inventory.nextRechargeAt
			},
			{ family: 'PREMIUM', available: Math.min(1, inventory.available), max: 1, bonus: 0 },
			{ family: 'PREMIUM_PLUS', available: 0, max: 1, bonus: 1 }
		],
		slots: mockPackCatalogue
			.filter((pack) => pack.status === 'OPEN')
			.map((pack) => ({
				id: pack.slotId,
				name: `Slot ${pack.slotId}`,
				pack: {
					id: pack.id,
					name: pack.name,
					description: pack.description,
					image: 'image' in pack ? pack.image : undefined,
					renderKey: pack.renderKey,
					family: pack.family,
					nbCards: pack.nbCards,
					openAll: pack.openAll
				}
			}))
	};
}

export function createMockApiResponse({ path, method = 'GET', body }: MockApiRequest): Response {
	const requestUrl = new URL(path, 'http://mock-api.local');
	const routedPath = requestUrl.pathname.replace(/^\/api(?=\/)/, '');
	const url = new URL(`${routedPath}${requestUrl.search}`, requestUrl.origin);
	const { pathname } = url;
	const normalizedMethod = method.toUpperCase();
	const communityResponse = communityMocks.handle(
		pathname,
		normalizedMethod,
		body,
		url.searchParams
	);
	if (communityResponse) return communityResponse;
	if (normalizedMethod === 'POST' && pathname === '/me/achievements/claim') {
		const claimed = mockAchievements.filter((item) => item.unlockedAt && !item.claimedAt);
		for (const item of claimed) item.claimedAt = new Date().toISOString();
		return json({ claimed: claimed.map((item) => item.code) });
	}

	const auctionResponse = auctionMocks.handle(pathname, normalizedMethod, body, url.searchParams);
	if (auctionResponse) return auctionResponse;
	if (normalizedMethod === 'POST' && pathname === '/oauth2/revoke') return json(undefined);
	if (normalizedMethod === 'GET' && pathname === '/variants') {
		const scenario =
			typeof sessionStorage !== 'undefined'
				? sessionStorage.getItem('wikiforge-template-scenario')
				: null;
		return json(
			scenario
				? mockVariants.map((v) => ({
						...v,
						renderKey: scenario === 'missing' ? 'tpl:missing@1' : 'tpl:cyberpunk@1'
					}))
				: mockVariants
		);
	}
	if (normalizedMethod === 'GET' && pathname === '/me/achievements') return json(mockAchievements);
	const achievementClaimMatch = /^\/me\/achievements\/([^/]+)\/claim$/.exec(pathname);
	if (normalizedMethod === 'POST' && achievementClaimMatch) {
		const achievement = mockAchievements.find(
			(entry) => entry.code === decodeURIComponent(achievementClaimMatch[1])
		);
		if (!achievement) return error(404, 'Succès introuvable.', 'NOT_FOUND');
		if (!achievement.unlockedAt || achievement.claimedAt)
			return error(409, 'Succès non réclamable.', 'ACHIEVEMENT_CONFLICT');
		achievement.claimedAt = new Date().toISOString();
		return json(undefined, 204);
	}
	if (normalizedMethod === 'GET' && pathname === '/notifications') {
		const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
		const results = unreadOnly
			? mockNotifications.filter((notification) => !notification.read)
			: mockNotifications;
		return json({
			results,
			nextCursor: null,
			hasNext: false,
			unread: mockNotifications.filter((notification) => !notification.read).length
		});
	}
	if (normalizedMethod === 'POST' && pathname === '/notifications/read-all') {
		mockNotifications.forEach((notification) => (notification.read = true));
		return json(undefined, 204);
	}
	const notificationReadMatch = /^\/notifications\/(\d+)\/read$/.exec(pathname);
	if (normalizedMethod === 'PATCH' && notificationReadMatch) {
		if (
			typeof sessionStorage !== 'undefined' &&
			sessionStorage.getItem('wikiforge-ux-scenario') === 'notification-error'
		)
			return error(503, 'Lecture indisponible.', 'UNAVAILABLE');
		const notification = mockNotifications.find(
			(entry) => entry.id === Number(notificationReadMatch[1])
		);
		if (!notification) return error(404, 'Notification introuvable.', 'NOT_FOUND');
		notification.read = true;
		return json(undefined, 204);
	}
	if (normalizedMethod === 'POST' && pathname === '/auth/logout-all') return json(undefined, 204);
	if (normalizedMethod === 'POST' && pathname === '/oauth2/token') {
		const input = asForm(body);
		if (input?.grant_type === 'refresh_token' && input.refresh_token) {
			return json(oauthTokens(users.get('demo-user')!));
		}
		if (input?.grant_type !== 'password' || !input.username || !input.password) {
			return error(400, 'Identifiants OAuth invalides.', 'INVALID_GRANT');
		}
		const user =
			[...users.values()].find((candidate) => candidate.email === input.username) ??
			users.get('demo-user')!;
		return json(oauthTokens(user));
	}
	if ((normalizedMethod === 'GET' || normalizedMethod === 'PATCH') && pathname === '/me') {
		const user = users.get('demo-user')!;
		const profile = profileSettings.get('demo-user')!;
		if (normalizedMethod === 'PATCH') {
			const input = asObject(body);
			if (typeof input?.name === 'string') {
				user.username = input.name;
				user.displayName = input.name;
			}
			if (typeof input?.imagePageId === 'number') {
				user.imagePageId = input.imagePageId;
				user.avatarUrl =
					mockCards.find((card) => card.baseCardId === input.imagePageId)?.imageUrl ??
					user.avatarUrl;
			}
			if (typeof input?.nsfw === 'boolean') profile.nsfwEnabled = input.nsfw;
			if (
				input?.visibility === 'PRIVATE' ||
				input?.visibility === 'FRIENDS' ||
				input?.visibility === 'PUBLIC'
			)
				profile.visibility = input.visibility;
			if (Array.isArray(input?.safeWords)) {
				profile.censoredKeywords = input.safeWords.filter(
					(word): word is string => typeof word === 'string'
				);
			}
			if (Array.isArray(input?.mutedNotifications)) {
				user.mutedNotifications = input.mutedNotifications.filter(
					(category): category is import('$lib/types').MutedNotificationCategory =>
						category === 'TRADE' ||
						category === 'SALE' ||
						category === 'AUCTION' ||
						category === 'FRIEND' ||
						category === 'GUILD'
				);
			}
		}
		return json({
			id: wikiForgeUserId(user.id),
			name: user.username,
			email: user.email,
			roles: [user.role.toUpperCase()],
			imagePageId: user.imagePageId ?? null,
			image: user.avatarUrl,
			nsfw: profile.nsfwEnabled,
			safeWords: profile.censoredKeywords,
			mutedNotifications: user.mutedNotifications ?? [],
			money: user.money ?? 350,
			createdAt: user.createdAt,
			visibility: profile.visibility,
			lastConnection: 'TODAY',
			rank: 12,
			banners: mockBanners
		});
	}
	if (normalizedMethod === 'PATCH' && pathname === '/me/image') {
		const input = asObject(body);
		const user = users.get('demo-user')!;
		user.imagePageId = typeof input?.imagePageId === 'number' ? input.imagePageId : null;
		user.avatarUrl =
			user.imagePageId == null
				? null
				: (mockCards.find((card) => card.baseCardId === user.imagePageId)?.imageUrl ?? null);
		const profile = profileSettings.get('demo-user')!;
		return json({
			id: 1,
			name: user.username,
			email: user.email,
			roles: ['USER'],
			imagePageId: user.imagePageId,
			image: user.avatarUrl,
			nsfw: profile.nsfwEnabled,
			safeWords: profile.censoredKeywords,
			money: user.money ?? 350,
			createdAt: user.createdAt,
			visibility: profile.visibility,
			lastConnection: 'TODAY',
			rank: 12
		});
	}
	if (pathname === '/me/showcase' && normalizedMethod === 'GET')
		return json({
			slots: mockShowcaseSlots,
			maxSlots: 6,
			usedSlots: mockShowcaseLines.flatMap((line) => line.cards).length,
			slotPrice: 100,
			lines: mockShowcaseLines
		});
	if (pathname === '/me/showcase' && normalizedMethod === 'PUT') {
		const input = asObject(body);
		const lines = Array.isArray(input?.lines) ? input.lines : [];
		mockShowcaseLines = lines.flatMap((candidate) => {
			const line = asObject(candidate);
			if (!line || typeof line.title !== 'string' || !Array.isArray(line.cardIds)) return [];
			const cards = line.cardIds.flatMap((id) =>
				typeof id === 'number' && mockCards[id - 1] ? [showcaseCard(mockCards[id - 1], id)] : []
			);
			return cards.length ? [{ title: line.title, cards }] : [];
		});
		return json({
			slots: mockShowcaseSlots,
			maxSlots: 6,
			usedSlots: mockShowcaseLines.flatMap((line) => line.cards).length,
			slotPrice: 100,
			lines: mockShowcaseLines
		});
	}
	if (pathname === '/me/showcase/slots' && normalizedMethod === 'POST') {
		mockShowcaseSlots += 1;
		return json({
			slots: mockShowcaseSlots,
			maxSlots: 6,
			usedSlots: mockShowcaseLines.flatMap((line) => line.cards).length,
			slotPrice: 100,
			lines: mockShowcaseLines
		});
	}
	if (normalizedMethod === 'GET' && pathname === '/me/money') {
		return json(users.get('demo-user')?.money ?? 350);
	}
	if (normalizedMethod === 'GET' && pathname === '/welcome') {
		const inventory = boosterInventory('demo-user');
		return json({
			boosters: mockBoostersPayload(inventory),
			collection: {
				nbCards: mockCards.reduce((total, card) => total + card.ownedCount, 0),
				rank: 12,
				recent: mockCards.slice(0, 6).map((card, index) => collectionCard(card, index + 1))
			},
			pendingTrades: 0,
			pendingAuction: auctionMocks.records.filter(
				(item) => item.status === 'OPEN' && (item.seller.id === 1 || item.leading)
			).length,
			money: users.get('demo-user')?.money ?? 350
		});
	}
	const userProfileMatch = /^\/users\/(\d+)$/.exec(pathname);
	if (normalizedMethod === 'GET' && userProfileMatch) {
		const user = userByWikiForgeId(userProfileMatch[1]);
		if (!user) return error(404, 'Joueur introuvable.', 'NOT_FOUND');
		const full = user.id !== 'blocked-user';
		return json({
			id: wikiForgeUserId(user.id),
			name: user.username,
			imagePageId: user.imagePageId,
			image: user.avatarUrl,
			joinedAt: user.createdAt.slice(0, 7),
			lastConnection: simpleWikiForgeUser(user).lastConnection,
			full,
			nbCards: mockCards.reduce((sum, card) => sum + card.ownedCount, 0),
			...(full
				? {
						tags: mockCollectionTags.slice(0, 2).map(({ name, color }) => ({ name, color })),
						showcase: mockShowcaseLines
					}
				: {})
		});
	}
	const userSalesMatch = /^\/users\/(\d+)\/sales$/.exec(pathname);
	if (normalizedMethod === 'GET' && userSalesMatch) {
		if (!userByWikiForgeId(userSalesMatch[1]))
			return error(404, 'Joueur introuvable.', 'NOT_FOUND');
		return json({ instantSales: mockInstantSales });
	}
	if (normalizedMethod === 'POST' && pathname === '/me/sales') {
		const input = asObject(body);
		const cardId = Number(input?.cardId);
		const price = Number(input?.price);
		if (!Number.isSafeInteger(cardId) || !Number.isSafeInteger(price) || price <= 0)
			return error(400, 'Vente invalide.', 'INVALID_PARAMETER');
		if (
			mockInstantSales.length >= 3 ||
			mockInstantSales.some((sale) => sale.card.id === cardId) ||
			!mockCards[cardId - 1]
		)
			return error(409, 'Conflit de vente.', 'SALE_CONFLICT');
		mockInstantSales = [
			...mockInstantSales,
			{ id: nextInstantSaleId++, price, card: showcaseCard(mockCards[cardId - 1], cardId) }
		];
		return json({ instantSales: mockInstantSales });
	}
	const mySaleMatch = /^\/me\/sales\/(\d+)$/.exec(pathname);
	if (normalizedMethod === 'DELETE' && mySaleMatch) {
		mockInstantSales = mockInstantSales.filter((sale) => sale.id !== Number(mySaleMatch[1]));
		return json({ instantSales: mockInstantSales });
	}
	const buySaleMatch = /^\/sales\/(\d+)\/buy$/.exec(pathname);
	if (normalizedMethod === 'POST' && buySaleMatch) {
		const sale = mockInstantSales.find((entry) => entry.id === Number(buySaleMatch[1]));
		if (!sale) return error(409, 'Vente indisponible.', 'SALE_CONFLICT');
		const user = users.get('demo-user')!;
		if ((user.money ?? 0) < sale.price) return error(409, 'Solde insuffisant.', 'NOT_ENOUGH_MONEY');
		user.money = (user.money ?? 0) - sale.price;
		mockInstantSales = mockInstantSales.filter((entry) => entry !== sale);
		return json(undefined, 204);
	}
	const leaderboardMatch = /^\/leaderboards\/(global|daily|weekly)$/.exec(pathname);
	if (normalizedMethod === 'GET' && leaderboardMatch) {
		const entries = [...users.values()].slice(0, 20).map((user, index) => ({
			rank: index + 1,
			id: wikiForgeUserId(user.id),
			name: user.username,
			imagePageId: user.imagePageId,
			image: user.avatarUrl,
			nbCards:
				leaderboardMatch[1] === 'global' ? Math.max(1, 120 - index * 7) : Math.max(1, 18 - index)
		}));
		return json({
			top: entries,
			around: entries.some((entry) => entry.id === 1) ? undefined : entries.slice(-3),
			computedAt: now,
			refreshAt: new Date(Date.now() + 5 * 60_000).toISOString()
		});
	}
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
		const variantIds = url.searchParams.getAll('variant').map(Number);
		const items = mockCards.filter(
			(card) =>
				(!query || card.title.toLocaleLowerCase('fr-FR').includes(query)) &&
				(!variantIds.length || variantIds.includes(card.variantId))
		);
		return json({
			results: items.slice(page * pageSize, (page + 1) * pageSize).map(apiCard),
			page,
			nbResults: items.length,
			size: pageSize,
			nextCursor: (page + 1) * pageSize < items.length ? `mock-cards-cursor-${page + 1}` : null,
			sortBy: url.searchParams.get('sortBy') ?? 'name',
			sortDirection: url.searchParams.get('sortDirection') ?? 'ASC',
			filters: { variant: variantIds },
			q: query ?? null
		});
	}
	const friendCollectionMatch = /^\/friends\/(\d+)\/collection$/.exec(pathname);
	if (normalizedMethod === 'GET' && friendCollectionMatch) {
		if (!userByWikiForgeId(friendCollectionMatch[1])) {
			return error(404, 'Ami introuvable.', 'NOT_FOUND');
		}
		return createMockApiResponse({
			path: path.replace(/^\/friends\/\d+\/collection/, '/collection'),
			method,
			body
		});
	}
	const friendTagsMatch = /^\/friends\/(\d+)\/tags$/.exec(pathname);
	if (normalizedMethod === 'GET' && friendTagsMatch) {
		if (!userByWikiForgeId(friendTagsMatch[1])) {
			return error(404, 'Ami introuvable.', 'NOT_FOUND');
		}
		return json(
			mockCollectionTags.map((tag, index) => ({ ...tag, id: index + 1, visibility: undefined }))
		);
	}
	if (normalizedMethod === 'GET' && pathname === '/collection') {
		const cursorPage = /mock-collection-cursor-(\d+)/.exec(url.searchParams.get('cursor') ?? '');
		const page = cursorPage
			? Number(cursorPage[1])
			: Math.max(0, Number(url.searchParams.get('page') ?? 0));
		const pageSize = 50;
		const query = url.searchParams.get('q')?.toLocaleLowerCase('fr-FR');
		const variantIds = url.searchParams.getAll('variant').map(Number);
		const tagIds = url.searchParams.getAll('tags');
		const duplicate = url.searchParams.get('duplicate');
		const protection = url.searchParams.get('protected');
		const wishlistOwner = url.searchParams.get('wishlist');
		const wishlistUser = wishlistOwner ? userByWikiForgeId(wishlistOwner) : undefined;
		const wishedCardIds = new Set(
			wishlistUser
				? (wishlists.get(wishlistUser.id) ?? []).flatMap((registry) => registry.cardIds)
				: []
		);
		const items = mockCards
			.map((card, index) => ({ card, index, tagIds: index % 3 === 0 ? [] : [index % 2 ? 2 : 1] }))
			.filter(
				({ card, index, tagIds: cardTagIds }) =>
					card.ownedCount > 0 &&
					(!query || card.title.toLocaleLowerCase('fr-FR').includes(query)) &&
					(!variantIds.length || variantIds.includes(card.variantId)) &&
					(!tagIds.length ||
						(tagIds.includes('-1')
							? cardTagIds.length === 0
							: tagIds.every((tagId) => cardTagIds.includes(Number(tagId))))) &&
					(duplicate === null || String(card.ownedCount > 1) === duplicate) &&
					(protection === null || String(index % 3 === 0) === protection) &&
					(!wishlistOwner || wishedCardIds.has(card.id))
			);
		const pageItems = items.slice(page * pageSize, (page + 1) * pageSize);
		const hasNext = (page + 1) * pageSize < items.length;
		return json({
			results: pageItems.map(({ card, index, tagIds: cardTagIds }) => ({
				id: index + 1,
				pageId: card.baseCardId ?? index + 1,
				title: card.title,
				description: card.longDescription || card.shortDescription,
				image: card.imageUrl,
				nsfw: card.nsfw,
				variantId: card.variantId,
				packId: card.packId ?? 1,
				serialNumber: card.serialNumber,
				maxCopies: card.maxCopies,
				atk: card.attack,
				duplicate: card.ownedCount > 1,
				protected: index % 3 === 0,
				tagIds: cardTagIds,
				acquiredDate: card.acquiredAt ?? now,
				creationDate: now,
				pendingTradeId: null
			})),
			page,
			nbResults:
				query || variantIds.length || tagIds.length || duplicate || protection || wishlistOwner
					? -1
					: items.length,
			sortBy: url.searchParams.get('sortBy') ?? 'ACQUIRED_DATE',
			sortDirection: 'DESC',
			nextCursor:
				hasNext && !query && url.searchParams.get('sortBy') !== 'NAME'
					? `mock-collection-cursor-${page + 1}`
					: null,
			hasNext,
			q: query ?? null
		});
	}
	if (normalizedMethod === 'GET' && pathname === '/tags') {
		return json(
			mockCollectionTags.map((tag, index) => ({
				...tag,
				id: index + 1,
				visibility: tag.visibility ?? 'FRIENDS'
			}))
		);
	}
	if (normalizedMethod === 'POST' && pathname === '/tags') {
		const input = asObject(body);
		return json({
			id: mockCollectionTags.length + 1,
			name: input?.name,
			color: input?.color,
			visibility: input?.visibility
		});
	}
	const tagMatch = /^\/tags\/(\d+)$/.exec(pathname);
	if (tagMatch && normalizedMethod === 'PATCH') {
		const input = asObject(body);
		return json({
			id: Number(tagMatch[1]),
			name: input?.name,
			color: input?.color,
			visibility: input?.visibility
		});
	}
	if (tagMatch && normalizedMethod === 'DELETE') return json(undefined, 204);
	if (/^\/collection\/\d+\/(?:protect|unprotect)$/.test(pathname) && normalizedMethod === 'PUT') {
		return json(undefined, 204);
	}
	if (
		(pathname === '/collection/protect' || pathname === '/collection/unprotect') &&
		normalizedMethod === 'PUT'
	) {
		return Array.isArray(body) && body.length
			? json(undefined, 204)
			: error(404, 'Aucune carte sélectionnée.', 'NOT_FOUND');
	}
	const collectionDetailMatch = /^\/collection\/(\d+)$/.exec(pathname);
	if (normalizedMethod === 'GET' && collectionDetailMatch) {
		const cardIndex = Number(collectionDetailMatch[1]) - 1;
		const card = mockCards[cardIndex];
		return card
			? json({
					...collectionCard(card, cardIndex + 1),
					wishlists: [{ id: 301, name: 'Cartes cinéma', userId: 2, userName: 'SoneS9' }]
				})
			: error(404, 'Carte introuvable.', 'NOT_FOUND');
	}
	const collectionCardTagMatch = /^\/collection\/(\d+)\/tags\/\d+$/.exec(pathname);
	if (collectionCardTagMatch && (normalizedMethod === 'PUT' || normalizedMethod === 'DELETE')) {
		const cardIndex = Number(collectionCardTagMatch[1]) - 1;
		const card = mockCards[cardIndex];
		return card
			? json(collectionCard(card, cardIndex + 1))
			: error(404, 'Carte introuvable.', 'NOT_FOUND');
	}
	if (
		/^\/collection\/tags\/\d+$/.test(pathname) &&
		(normalizedMethod === 'PUT' || normalizedMethod === 'DELETE')
	) {
		const ids = Array.isArray(body)
			? body.filter((id): id is number => typeof id === 'number')
			: [];
		return json(
			ids.flatMap((id) => {
				const card = mockCards[id - 1];
				return card ? [collectionCard(card, id)] : [];
			})
		);
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
		const summary = (registry: LegacyWishlistRegistry, ownerName?: string) => ({
			id: registry.id,
			name: registry.title,
			description: registry.description,
			nbCards: registry.cardIds.length,
			ownerName: ownerName ?? null,
			invitedAt: ownerName ? now : null,
			sharedWithGuild: registry.sharedWithGuild ?? false,
			imagePageId: registry.imagePageId ?? registry.cards[0]?.baseCardId ?? null,
			image: registry.imageUrl ?? registry.cards[0]?.imageUrl ?? null
		});
		return json({
			owned: (wishlists.get('demo-user') ?? []).map((registry) => summary(registry)),
			shared: [
				...(!sharedWishlistLeft
					? (wishlists.get('friend-0') ?? []).map((registry) => summary(registry, 'SoneS9'))
					: []),
				...(pendingWishlistState === 'shared'
					? [
							{
								id: '301',
								name: 'Cartes cinéma',
								description: 'Liste partagée.',
								nbCards: 2,
								ownerName: 'OnMyGhost',
								invitedAt: now
							}
						]
					: [])
			],
			pending:
				pendingWishlistState === 'pending'
					? [
							{
								id: '301',
								name: 'Cartes cinéma',
								description: 'Invitation en attente.',
								ownerName: 'OnMyGhost',
								invitedAt: now
							}
						]
					: []
		});
	}
	if (normalizedMethod === 'GET' && pathname === '/pages') {
		const query = url.searchParams.get('q')?.trim().toLocaleLowerCase('fr-FR') ?? '';
		const page = Math.max(0, Number(url.searchParams.get('page') ?? 0));
		const sortBy = (url.searchParams.get('sortBy') ?? 'name').toUpperCase();
		const sortDirection = url.searchParams.get('sortDirection') === 'DESC' ? 'DESC' : 'ASC';
		const cards = [...new Map(mockCards.map((card) => [card.baseCardId, card])).values()]
			.filter((card) => !query || card.title.toLocaleLowerCase('fr-FR').includes(query))
			.toSorted((left, right) => {
				const comparison = left.title.localeCompare(right.title, 'fr');
				return sortDirection === 'DESC' ? -comparison : comparison;
			});
		return json({
			nbResults: cards.length,
			page,
			results: cards.slice(page * 48, (page + 1) * 48).map(publicPage),
			sortBy,
			sortDirection
		});
	}
	const publicPageMatch = /^\/pages\/([^/]+)$/.exec(pathname);
	if (normalizedMethod === 'GET' && publicPageMatch) {
		const id = Number(decodeURIComponent(publicPageMatch[1]));
		const card = mockCards.find((entry) => entry.baseCardId === id);
		return card ? json(publicPage(card)) : error(404, 'Carte introuvable.', 'PAGE_NOT_FOUND');
	}
	if (normalizedMethod === 'POST' && pathname === '/wishlists') {
		const input = asObject(body);
		const userId = 'demo-user';
		const title = typeof input?.name === 'string' ? input.name.trim() : '';
		const description = typeof input?.description === 'string' ? input.description.trim() : '';
		if (!title) return error(400, 'Titre requis.', 'WISHLIST_TITLE_REQUIRED');
		const registry: LegacyWishlistRegistry = {
			id: String(Date.now()),
			userId,
			title,
			description,
			isPublic: false,
			cardIds: [],
			cards: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			sharedWithGuild: Boolean(input?.sharedWithGuild),
			imagePageId: typeof input?.imagePageId === 'number' ? input.imagePageId : null,
			imageUrl:
				typeof input?.imagePageId === 'number'
					? (mockCards.find((card) => card.baseCardId === input.imagePageId)?.imageUrl ?? null)
					: null
		};
		wishlists.set(userId, [registry, ...(wishlists.get(userId) ?? [])]);
		return json(
			{
				id: registry.id,
				name: title,
				description,
				nbCards: 0,
				sharedWithGuild: registry.sharedWithGuild ?? false,
				imagePageId: registry.imagePageId,
				image: registry.imageUrl
			},
			200
		);
	}
	if (normalizedMethod === 'GET' && pathname === '/messages/guild-wishlists') {
		return json(guildWishlistShares);
	}
	if (normalizedMethod === 'GET' && pathname === '/conversations') {
		const direct = conversations.filter((conversation) => conversation.kind === 'direct');
		return json({
			results: direct.flatMap((conversation, index) => {
				const participantId = conversation.participantIds.find((id) => id !== 'demo-user');
				const participant = participantId ? users.get(participantId) : undefined;
				if (!participant || blockedUserIds.has(participant.id)) return [];
				const lastMessage = (messages.get(conversation.id) ?? []).at(-1);
				return [
					{
						id: index + 1,
						user: simpleWikiForgeUser(participant),
						lastMessage: lastMessage
							? {
									id: Number.parseInt(lastMessage.id.replace(/\D/g, ''), 10) || 1,
									conversationId: index + 1,
									fromUserId: wikiForgeUserId(lastMessage.senderId),
									type: lastMessage.tradeOffer ? 'TRADE' : 'TEXT',
									content: lastMessage.tradeOffer ? null : lastMessage.content,
									meta: lastMessage.tradeOffer
										? JSON.stringify({
												tradeId: Reflect.get(lastMessage.tradeOffer, 'offerId'),
												status: Reflect.get(lastMessage.tradeOffer, 'status')
											})
										: null,
									creationDate: lastMessage.createdAt
								}
							: null,
						unread: conversation.unreadCount
					}
				];
			}),
			nextCursor: null,
			hasNext: false
		});
	}
	const canonicalMessagesMatch = /^\/conversations\/(\d+)\/messages$/.exec(pathname);
	if (canonicalMessagesMatch) {
		const participant = userByWikiForgeId(canonicalMessagesMatch[1]);
		const conversation = participant
			? conversations.find(
					(entry) => entry.kind === 'direct' && entry.participantIds.includes(participant.id)
				)
			: undefined;
		if (normalizedMethod === 'GET') {
			if (!conversation) return json({ results: [], nextCursor: null, hasNext: false });
			conversation.unreadCount = 0;
			const records = (messages.get(conversation.id) ?? []).toReversed();
			return json({
				results: records.map((message, index) => ({
					id: index + 1,
					conversationId: Number.parseInt(conversation.id.replace(/\D/g, ''), 10) || 1,
					fromUserId: wikiForgeUserId(message.senderId),
					type: message.tradeOffer ? 'TRADE' : 'TEXT',
					content: message.tradeOffer ? null : message.content,
					meta: message.tradeOffer
						? JSON.stringify({
								tradeId: Reflect.get(message.tradeOffer, 'offerId'),
								status: Reflect.get(message.tradeOffer, 'status')
							})
						: null,
					creationDate: message.createdAt
				})),
				nextCursor: null,
				hasNext: false
			});
		}
		if (normalizedMethod === 'POST' && participant) {
			const content = asObject(body)?.content;
			if (typeof content !== 'string' || !content.trim() || content.trim().length > 2_000) {
				return error(400, 'Message invalide.', 'INVALID_PARAMETER');
			}
			const target = conversation ?? {
				id: `conversation-${participant.id}`,
				kind: 'direct' as const,
				userId: participant.id,
				title: participant.displayName || participant.username,
				participantIds: ['demo-user', participant.id],
				preview: '',
				unreadCount: 0,
				updatedAt: now
			};
			if (!conversation) conversations.unshift(target);
			const createdAt = new Date().toISOString();
			const message: MessageRecord = {
				id: `message-${Date.now()}`,
				conversationId: target.id,
				senderId: 'demo-user',
				type: 'text',
				content: content.trim(),
				createdAt,
				readAt: createdAt,
				reactions: []
			};
			messages.set(target.id, [...(messages.get(target.id) ?? []), message]);
			return json({
				id: Date.now(),
				conversationId: Number.parseInt(target.id.replace(/\D/g, ''), 10) || 1,
				fromUserId: 1,
				type: 'TEXT',
				content: message.content,
				creationDate: createdAt
			});
		}
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
	if (normalizedMethod === 'POST' && pathname === '/conversations/direct') {
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
		const imported: LegacyWishlistRegistry = {
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
	const wishlistRegistryMatch = /^\/wishlists\/([^/]+)$/.exec(pathname);
	if (wishlistRegistryMatch) {
		const id = decodeURIComponent(wishlistRegistryMatch[1]);
		const ownerRegistries = wishlists.get('demo-user') ?? [];
		const registry = [...wishlists.values(), [pendingWishlistRegistry]]
			.flat()
			.find((entry) => entry.id === id);
		if (!registry) return error(404, 'Wishlist introuvable.', 'WISHLIST_NOT_FOUND');
		if (normalizedMethod === 'GET') {
			const query = url.searchParams.get('q')?.trim().toLocaleLowerCase('fr-FR') ?? '';
			const page = Math.max(0, Number(url.searchParams.get('page') ?? 0));
			const sortBy = url.searchParams.get('sortBy') ?? 'ADDED_AT';
			const sortDirection = url.searchParams.get('sortDirection') === 'ASC' ? 'ASC' : 'DESC';
			const cards = registry.cards
				.filter((card) => !query || card.title.toLocaleLowerCase('fr-FR').includes(query))
				.toSorted((left, right) => {
					const comparison =
						sortBy === 'NAME'
							? left.title.localeCompare(right.title, 'fr')
							: (left.acquiredAt ?? now).localeCompare(right.acquiredAt ?? now);
					return sortDirection === 'DESC' ? -comparison : comparison;
				});
			return json({
				nbResults: cards.length,
				page,
				sortBy,
				sortDirection,
				results: cards.slice(page * 50, (page + 1) * 50).map((card) => ({
					page: publicPage(card),
					addedAt: card.acquiredAt ?? now
				})),
				filters: {}
			});
		}
		if (normalizedMethod === 'PATCH') {
			const input = asObject(body) ?? {};
			if (typeof input.name === 'string' && input.name.trim()) registry.title = input.name.trim();
			if (typeof input.description === 'string') registry.description = input.description;
			registry.sharedWithGuild = Boolean(input.sharedWithGuild);
			if (typeof input.imagePageId === 'number' || input.imagePageId === null) {
				registry.imagePageId = typeof input.imagePageId === 'number' ? input.imagePageId : null;
				registry.imageUrl =
					typeof input.imagePageId === 'number'
						? (mockCards.find((card) => card.baseCardId === input.imagePageId)?.imageUrl ?? null)
						: null;
			}
			return json({
				id: registry.id,
				name: registry.title,
				description: registry.description,
				nbCards: registry.cardIds.length,
				sharedWithGuild: registry.sharedWithGuild ?? false,
				imagePageId: registry.imagePageId ?? null,
				image: registry.imageUrl ?? null
			});
		}
		if (normalizedMethod === 'DELETE' && ownerRegistries.includes(registry)) {
			wishlists.set(
				'demo-user',
				ownerRegistries.filter((entry) => entry !== registry)
			);
			return json(undefined, 204);
		}
	}

	const wishlistPageBatchMatch = /^\/wishlists\/([^/]+)\/pages$/.exec(pathname);
	if (wishlistPageBatchMatch && (normalizedMethod === 'PUT' || normalizedMethod === 'DELETE')) {
		const registry = (wishlists.get('demo-user') ?? []).find(
			(entry) => entry.id === decodeURIComponent(wishlistPageBatchMatch[1])
		);
		if (!registry) return error(404, 'Wishlist introuvable.', 'WISHLIST_NOT_FOUND');
		const pageIds = Array.isArray(body)
			? body.filter((id): id is number => typeof id === 'number')
			: [];
		if (!pageIds.length) return error(404, 'Aucun article sélectionné.', 'NOT_FOUND');
		for (const pageId of pageIds) {
			const card = mockCards.find((entry) => entry.baseCardId === pageId);
			if (!card && normalizedMethod === 'PUT')
				return error(404, 'Carte introuvable.', 'PAGE_NOT_FOUND');
			if (!card) continue;
			if (normalizedMethod === 'PUT' && !registry.cards.includes(card)) {
				registry.cards.push(card);
				registry.cardIds.push(card.id);
			}
			if (normalizedMethod === 'DELETE') {
				registry.cards = registry.cards.filter((entry) => entry !== card);
				registry.cardIds = registry.cardIds.filter((entry) => entry !== card.id);
			}
		}
		return json(undefined, 204);
	}
	const wishlistOwnedPagesMatch = /^\/wishlists\/([^/]+)\/pages\/owned$/.exec(pathname);
	if (wishlistOwnedPagesMatch && normalizedMethod === 'DELETE') {
		const registry = (wishlists.get('demo-user') ?? []).find(
			(entry) => entry.id === decodeURIComponent(wishlistOwnedPagesMatch[1])
		);
		if (!registry) return error(404, 'Wishlist introuvable.', 'WISHLIST_NOT_FOUND');
		registry.cards = registry.cards.filter((card) => card.ownedCount < 1);
		registry.cardIds = registry.cards.map((card) => card.id);
		return json(undefined, 204);
	}
	const wishlistPageMatch = /^\/wishlists\/([^/]+)\/pages\/([^/]+)$/.exec(pathname);
	if (wishlistPageMatch && (normalizedMethod === 'PUT' || normalizedMethod === 'DELETE')) {
		const [, encodedWishlistId, encodedPageId] = wishlistPageMatch;
		const registry = (wishlists.get('demo-user') ?? []).find(
			(entry) => entry.id === decodeURIComponent(encodedWishlistId)
		);
		if (!registry) return error(404, 'Wishlist introuvable.', 'WISHLIST_NOT_FOUND');
		const pageId = Number(decodeURIComponent(encodedPageId));
		const card = mockCards.find((entry) => entry.baseCardId === pageId);
		if (!card) return error(404, 'Carte introuvable.', 'PAGE_NOT_FOUND');
		if (normalizedMethod === 'PUT' && !registry.cards.includes(card)) {
			registry.cards.push(card);
			registry.cardIds.push(card.id);
		}
		if (normalizedMethod === 'DELETE') {
			registry.cards = registry.cards.filter((entry) => entry !== card);
			registry.cardIds = registry.cardIds.filter((entry) => entry !== card.id);
		}
		return json(undefined, 200);
	}

	const wishlistSharesMatch = /^\/wishlists\/([^/]+)\/shares(?:\/([^/]+))?$/.exec(pathname);
	if (wishlistSharesMatch) {
		const wishlistId = decodeURIComponent(wishlistSharesMatch[1]);
		const actionId = wishlistSharesMatch[2] ? decodeURIComponent(wishlistSharesMatch[2]) : null;
		if (normalizedMethod === 'GET' && !actionId)
			return json(wishlistFollowers.get(wishlistId) ?? []);
		if (normalizedMethod === 'POST' && actionId === 'accept') {
			pendingWishlistState = 'shared';
			return json(undefined, 200);
		}
		if (normalizedMethod === 'POST' && actionId && /^\d+$/.test(actionId)) {
			const followers = wishlistFollowers.get(wishlistId) ?? [];
			if (!followers.some((entry) => String(entry.id) === actionId)) {
				followers.push({ id: Number(actionId), name: `Utilisateur ${actionId}`, accepted: false });
			}
			wishlistFollowers.set(wishlistId, followers);
			return json(undefined, 200);
		}
		if (normalizedMethod === 'DELETE' && actionId) {
			wishlistFollowers.set(
				wishlistId,
				(wishlistFollowers.get(wishlistId) ?? []).filter((entry) => String(entry.id) !== actionId)
			);
			return json(undefined, 200);
		}
		if (normalizedMethod === 'DELETE' && !actionId) {
			if (wishlistId === '301') pendingWishlistState = 'removed';
			else sharedWishlistLeft = true;
			return json(undefined, 200);
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
			nextCursor: (page + 1) * pageSize < items.length ? `mock-wishlist-cursor-${page + 1}` : null,
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
	if (normalizedMethod === 'GET' && pathname === '/boosters') {
		const inventory = boosterInventory('demo-user');
		return json(mockBoostersPayload(inventory));
	}
	if (normalizedMethod === 'GET' && pathname === '/packs') return json(mockPackCatalogue);
	const packDetailMatch = /^\/packs\/(\d+)$/.exec(pathname);
	if (normalizedMethod === 'GET' && packDetailMatch) {
		const pack = mockPackCatalogue.find((candidate) => candidate.id === Number(packDetailMatch[1]));
		return pack ? json(pack) : error(404, 'Pack introuvable.', 'NOT_FOUND');
	}
	const boosterOpenMatch = /^\/boosters\/(1|3)\/(open|open-all)$/.exec(pathname);
	if (normalizedMethod === 'POST' && boosterOpenMatch) {
		const packId = Number(boosterOpenMatch[1]);
		const userId = 'demo-user';
		const inventory = boosterInventory(userId);
		if (!inventory.available) return error(403, 'Aucun paquet disponible.', 'NO_BOOSTER_AVAILABLE');
		const state = boosterReserve.get(userId)!;
		const openedCount = boosterOpenMatch[2] === 'open-all' ? Math.min(state.available, 100) : 1;
		state.available -= openedCount;
		const cards = Array.from({ length: 5 * openedCount }, (_, index) => {
			const card = mockCards[Math.floor(Math.random() * mockCards.length)];
			card.ownedCount += 1;
			return {
				id: Date.now() + index,
				pageId: card.baseCardId ?? (Number.parseInt(card.id.replace(/\D/g, ''), 10) || index + 1),
				title: card.title,
				description: card.longDescription || card.shortDescription,
				image: card.imageUrl,
				variantId: card.variantId,
				packId,
				serialNumber: card.serialNumber,
				maxCopies: card.maxCopies,
				atk: card.attack,
				duplicate: card.ownedCount > 1,
				protected: false,
				tagIds: [],
				acquiredDate: new Date().toISOString(),
				creationDate: now,
				pendingTradeId: null
			};
		});
		return json({
			packId,
			cards
		});
	}
	if (normalizedMethod === 'GET' && pathname === '/tags')
		return json(mockCollectionTags.map((tag, index) => ({ ...tag, id: index + 1 })));
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
	if (normalizedMethod === 'GET' && tradePathname === '/trades') {
		return json({
			received: tradeOffers
				.filter(
					(offer) =>
						offer.recipientId === 'demo-user' &&
						offer.status === 'pending' &&
						!blockedUserIds.has(offer.initiatorId)
				)
				.map(apiTradeOffer),
			sent: tradeOffers
				.filter((offer) => offer.initiatorId === 'demo-user' && offer.status === 'pending')
				.map(apiTradeOffer),
			done: tradeOffers
				.filter(
					(offer) =>
						offer.status !== 'pending' &&
						(offer.initiatorId === 'demo-user' || offer.recipientId === 'demo-user')
				)
				.map(apiTradeOffer)
		});
	}
	if (normalizedMethod === 'POST' && tradePathname === '/trades') {
		const input = asObject(body);
		const recipient =
			typeof input?.recipientId === 'number'
				? userByWikiForgeId(String(input.recipientId))
				: undefined;
		if (recipient && blockedUserIds.has(recipient.id))
			return error(403, 'Cet utilisateur est bloqué.', 'USER_BLOCKED');
		if (
			!input ||
			!recipient ||
			!Array.isArray(input.offeredCardIds) ||
			!Array.isArray(input.requestedCardIds) ||
			(!input.offeredCardIds.length &&
				!input.requestedCardIds.length &&
				!(typeof input.offeredMoney === 'number' && input.offeredMoney > 0) &&
				!(typeof input.requestedMoney === 'number' && input.requestedMoney > 0))
		)
			return error(
				422,
				'Une offre doit contenir des cartes et deux participants.',
				'VALIDATION_ERROR'
			);
		const createdAt = new Date().toISOString();
		const offer: TradeOffer = {
			id: String(Math.max(0, ...tradeOffers.map((entry) => Number(entry.id))) + 1),
			initiatorId: 'demo-user',
			recipientId: recipient.id,
			initiator: mockTradeParticipant('demo-user'),
			recipient: mockTradeParticipant(recipient.id),
			offeredCardIds: (input.offeredCardIds as number[]).map(String),
			requestedCardIds: (input.requestedCardIds as number[]).map(String),
			offeredMoney: typeof input.offeredMoney === 'number' ? input.offeredMoney : 0,
			requestedMoney: typeof input.requestedMoney === 'number' ? input.requestedMoney : 0,
			originalOfferedMoney: typeof input.offeredMoney === 'number' ? input.offeredMoney : 0,
			originalRequestedMoney: typeof input.requestedMoney === 'number' ? input.requestedMoney : 0,
			message: typeof input.message === 'string' ? input.message : '',
			status: 'pending',
			createdAt,
			updatedAt: createdAt
		};
		tradeOffers.unshift(offer);
		return json(apiTradeOffer(offer));
	}
	const tradeMatch = /^\/trades\/([^/]+)$/.exec(tradePathname);
	if (tradeMatch && normalizedMethod === 'GET') {
		const offer = tradeOffers.find((entry) => entry.id === decodeURIComponent(tradeMatch[1]));
		if (!offer) return error(404, 'Offre introuvable.', 'TRADE_NOT_FOUND');
		return json(apiTradeOffer(offer));
	}
	const tradeActionMatch = /^\/trades\/([^/]+)\/(accept|decline|cancel|counter)$/.exec(
		tradePathname
	);
	if (tradeActionMatch && normalizedMethod === 'POST') {
		const offer = tradeOffers.find((entry) => entry.id === decodeURIComponent(tradeActionMatch[1]));
		if (!offer) return error(404, 'Offre introuvable.', 'TRADE_NOT_FOUND');
		if (offer.status !== 'pending') {
			return error(
				422,
				'Cette réponse ne peut pas être appliquée à l’offre.',
				'TRADE_INVALID_STATUS'
			);
		}
		const action = tradeActionMatch[2];
		offer.status =
			action === 'accept'
				? 'accepted'
				: action === 'decline'
					? 'declined'
					: action === 'counter'
						? 'countered'
						: 'cancelled';
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
	if (normalizedMethod === 'GET' && pathname === '/blocks') {
		return json(
			[...blockedUserIds].flatMap((id) => {
				const user = users.get(id);
				return user ? [{ ...simpleWikiForgeUser(user), createdAt: now }] : [];
			})
		);
	}
	const blockedUserMatch = /^\/blocks\/([^/]+)$/.exec(pathname);
	if (blockedUserMatch) {
		const user = userByWikiForgeId(decodeURIComponent(blockedUserMatch[1]));
		if (!user) return error(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
		if (normalizedMethod === 'POST') {
			blockedUserIds.add(user.id);
			return json(undefined, 204);
		}
		if (normalizedMethod === 'DELETE') {
			blockedUserIds.delete(user.id);
			return json(undefined, 204);
		}
	}
	if (normalizedMethod === 'GET' && pathname === '/users') {
		const query = url.searchParams.get('q')?.trim().toLocaleLowerCase('fr-FR') ?? '';
		return json(
			query.length < 3
				? []
				: [...users.values()]
						.filter(
							(user) =>
								user.id !== 'demo-user' &&
								!blockedUserIds.has(user.id) &&
								user.username.toLocaleLowerCase('fr-FR').includes(query)
						)
						.slice(0, 10)
						.map(simpleWikiForgeUser)
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
			censoredKeywords: [],
			visibility: 'FRIENDS'
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
			distinctCards: new Set(ownedCards.map((card) => card.baseCardId)).size,
			publicTags: mockCollectionTags
		});
	}
	const userCollectionMatch = /^\/users\/([^/]+)\/collection$/.exec(pathname);
	if (userCollectionMatch && normalizedMethod === 'GET') {
		const userId = decodeURIComponent(userCollectionMatch[1]);
		if (!users.has(userId)) return error(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
		const query = (url.searchParams.get('q') ?? '').trim().toLocaleLowerCase('fr-FR');
		const page = Math.max(0, Number(url.searchParams.get('page') ?? 0));
		const size = Math.max(1, Math.min(24, Number(url.searchParams.get('size') ?? 12)));
		const cards = mockCards
			.filter((card) =>
				userId === 'demo-user'
					? card.ownedCount > 0
					: card.friendsWhoOwn.some((friend) => friend.friendId === userId)
			)
			.filter((card) => !query || card.title.toLocaleLowerCase('fr-FR').includes(query));
		const results = cards.slice(page * size, (page + 1) * size);
		return json({
			results: results.map((card) => ({
				userCardId: `owned-${userId}-${card.id}`,
				cardId: card.id,
				acquiredAt: card.acquiredAt ?? now,
				tags: card.collectionTags ?? [],
				card: apiCard(card)
			})),
			page,
			nbResults: cards.length,
			size
		});
	}
	const userCollectionCopiesMatch = /^\/users\/([^/]+)\/collection\/copies$/.exec(pathname);
	if (userCollectionCopiesMatch && normalizedMethod === 'GET') {
		const userId = decodeURIComponent(userCollectionCopiesMatch[1]);
		const variantIds = new Set(url.searchParams.getAll('variantId'));
		return json(
			mockCards
				.filter(
					(card) =>
						variantIds.has(card.id) &&
						(userId === 'demo-user'
							? card.ownedCount > 0
							: card.friendsWhoOwn.some((friend) => friend.friendId === userId))
				)
				.map((card) => ({
					userCardId: `owned-${userId}-${card.id}`,
					cardId: card.id,
					acquiredAt: card.acquiredAt ?? now,
					tags: card.collectionTags ?? [],
					card: apiCard(card)
				}))
		);
	}
	const userCollectionCountsMatch = /^\/users\/([^/]+)\/collection\/counts$/.exec(pathname);
	if (userCollectionCountsMatch && normalizedMethod === 'GET') {
		const userId = decodeURIComponent(userCollectionCountsMatch[1]);
		const variantIds = new Set(url.searchParams.getAll('variantId'));
		return json(
			Object.fromEntries(
				mockCards.flatMap((card) => {
					if (!variantIds.has(card.id)) return [];
					const count =
						userId === 'demo-user'
							? card.ownedCount
							: (card.friendsWhoOwn.find((friend) => friend.friendId === userId)?.ownedCount ?? 0);
					return count > 0 ? [[card.id, count]] : [];
				})
			)
		);
	}
	if (normalizedMethod === 'GET' && pathname === '/collection/copies') {
		const userCardIds = new Set(url.searchParams.getAll('userCardId'));
		return json(
			mockCards
				.filter((card) => userCardIds.has(`owned-demo-user-${card.id}`))
				.map((card) => ({
					userCardId: `owned-demo-user-${card.id}`,
					cardId: card.id,
					acquiredAt: card.acquiredAt ?? now,
					tags: card.collectionTags ?? [],
					card: apiCard(card)
				}))
		);
	}
	if (normalizedMethod === 'POST' && pathname === '/cards/social-states') {
		const input = asObject(body);
		const cardIds = Array.isArray(input?.cardIds)
			? input.cardIds.filter((cardId): cardId is string => typeof cardId === 'string').slice(0, 100)
			: [];
		return json(
			cardIds.flatMap((cardId) => {
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
		const entries = friendships.get('demo-user') ?? [];
		return json({
			friends: entries
				.filter((entry) => entry.status === 'accepted')
				.map((entry) => simpleWikiForgeUser(entry.user)),
			received: entries
				.filter((entry) => entry.status === 'received')
				.map((entry) => simpleWikiForgeUser(entry.user)),
			sent: entries
				.filter((entry) => entry.status === 'sent')
				.map((entry) => simpleWikiForgeUser(entry.user))
		});
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
	const friendAcceptMatch = /^\/friends\/([^/]+)\/accept$/.exec(pathname);
	if (friendAcceptMatch && normalizedMethod === 'POST') {
		const friend = userByWikiForgeId(decodeURIComponent(friendAcceptMatch[1]));
		const entry =
			friend && (friendships.get('demo-user') ?? []).find((item) => item.user.id === friend.id);
		if (!entry || entry.status !== 'received')
			return error(404, 'Invitation introuvable.', 'FRIENDSHIP_NOT_FOUND');
		entry.status = 'accepted';
		return json(undefined, 204);
	}
	if (friendshipMatch) {
		const id = decodeURIComponent(friendshipMatch[1]);
		const canonicalFriend = userByWikiForgeId(id);
		if (canonicalFriend) {
			const entries = friendships.get('demo-user') ?? [];
			const existing = entries.find((entry) => entry.user.id === canonicalFriend.id);
			if (normalizedMethod === 'POST') {
				if (!existing) {
					friendships.set('demo-user', [
						...entries,
						{
							id: `friendship-${Date.now()}`,
							user: canonicalFriend,
							status: 'sent',
							createdAt: now,
							lastActiveAt: now
						}
					]);
				}
				return json(undefined, 204);
			}
			if (normalizedMethod === 'DELETE') {
				friendships.set(
					'demo-user',
					entries.filter((entry) => entry.user.id !== canonicalFriend.id)
				);
				return json(undefined, 204);
			}
		}
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
