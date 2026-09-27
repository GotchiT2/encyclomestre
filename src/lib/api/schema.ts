// Generated from docs/contracts/api.openapi.json. Run node scripts/generate-api-contract.mjs.
export interface ApiSchemas {
	ShowcaseLineRequest: { title: string; cardIds: Array<number> };
	ShowcaseRequest: { lines: Array<ApiSchemas['ShowcaseLineRequest']> };
	ShowcaseCardDTO: {
		id?: number;
		pageId?: number;
		title?: string;
		description?: string;
		image?: string;
		nsfw?: boolean;
		variantId?: number;
		packId?: number;
		serialNumber?: number;
		maxCopies?: number;
		atk?: number;
	};
	ShowcaseDTO: {
		slots?: number;
		maxSlots?: number;
		usedSlots?: number;
		slotPrice?: number;
		lines?: Array<ApiSchemas['ShowcaseLineDTO']>;
	};
	ShowcaseLineDTO: { title?: string; cards?: Array<ApiSchemas['ShowcaseCardDTO']> };
	GuildPermissionsRequest: { permissions: Array<'INVITE' | 'KICK' | 'GRANT' | 'EDIT'> };
	CardDTO: {
		id?: number;
		pageId?: number;
		title?: string;
		description?: string;
		image?: string;
		nsfw?: boolean;
		variantId?: number;
		packId?: number;
		serialNumber?: number;
		maxCopies?: number;
		atk?: number;
		duplicate?: boolean;
		protected?: boolean;
		tagIds?: Array<number>;
		acquiredDate?: string;
		creationDate?: string;
		pendingTradeId?: number;
		ownedCount?: number;
		wishlists?: Array<ApiSchemas['CardWishlistDTO']>;
	};
	CardWishlistDTO: { id?: number; name?: string; userId?: number; userName?: string };
	WishlistRequest: {
		name: string;
		description?: string;
		imagePageId?: number;
		sharedWithGuild?: boolean;
	};
	WishlistSummaryDTO: {
		id?: number;
		name?: string;
		description?: string;
		imagePageId?: number;
		image?: string;
		nbCards?: number;
		ownerName?: string;
		invitedAt?: string;
		sharedWithGuild?: boolean;
	};
	TradeRequest: {
		recipientId?: number;
		message?: string;
		offeredCardIds?: Array<number>;
		requestedCardIds?: Array<number>;
		offeredMoney?: number;
		requestedMoney?: number;
	};
	SimpleUserDTO: { id?: number; name?: string; imagePageId?: number; image?: string };
	TradeCardDTO: { card?: ApiSchemas['CardDTO']; status?: 'ADDED' | 'REMOVED' };
	TradeDTO: {
		id?: number;
		status?: 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
		message?: string;
		expiresAt?: string;
		creationDate?: string;
		modificationDate?: string;
		initiator?: ApiSchemas['SimpleUserDTO'];
		recipient?: ApiSchemas['SimpleUserDTO'];
		offered?: Array<ApiSchemas['TradeCardDTO']>;
		requested?: Array<ApiSchemas['TradeCardDTO']>;
		offeredMoney?: number;
		requestedMoney?: number;
		originalOfferedMoney?: number;
		originalRequestedMoney?: number;
	};
	CounterRequest: {
		message?: string;
		offeredCardIds?: Array<number>;
		requestedCardIds?: Array<number>;
		offeredMoney?: number;
		requestedMoney?: number;
	};
	TagRequest: { name: string; color: string; visibility: 'PRIVATE' | 'FRIENDS' | 'PUBLIC' };
	TagDTO: {
		id?: number;
		name?: string;
		color?: string;
		visibility?: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
	};
	ReportRequest: {
		type: 'USER' | 'MESSAGE' | 'GUILD_MESSAGE' | 'GUILD' | 'PAGE';
		id: number;
		reason: 'CHEATING' | 'NAME' | 'HARASSMENT' | 'SPAM' | 'INAPPROPRIATE' | 'OTHER';
		comment?: string;
	};
	SaleRequest: { cardId: number; price?: number };
	AuctionBidDTO: {
		user?: ApiSchemas['AuctionUserDTO'];
		amount?: number;
		auto?: boolean;
		date?: string;
	};
	AuctionDTO: {
		id?: number;
		seller?: ApiSchemas['AuctionUserDTO'];
		card?: ApiSchemas['ShowcaseCardDTO'];
		status?: 'OPEN' | 'SOLD' | 'UNSOLD' | 'CANCELLED';
		startPrice?: number;
		price?: number;
		minBid?: number;
		nbBids?: number;
		leader?: ApiSchemas['AuctionUserDTO'];
		leading?: boolean;
		myMax?: number;
		startsAt?: string;
		endsAt?: string;
		nbExtensions?: number;
		closedAt?: string;
		bids?: Array<ApiSchemas['AuctionBidDTO']>;
	};
	AuctionUserDTO: { id?: number; name?: string };
	InstantSaleDTO: { id?: number; price?: number; card?: ApiSchemas['ShowcaseCardDTO'] };
	SalesDTO: {
		instantSales?: Array<ApiSchemas['InstantSaleDTO']>;
		auctions?: Array<ApiSchemas['AuctionDTO']>;
	};
	ModerationCaseMessageRequest: { content: string };
	ModerationCaseDTO: {
		id?: number;
		subject?: string;
		status?: 'OPEN' | 'CLOSED';
		sanction?: ApiSchemas['SanctionDTO'];
		creationDate?: string;
		lastMessageAt?: string;
		closedAt?: string;
		unread?: number;
		messages?: Array<ApiSchemas['ModerationCaseMessageDTO']>;
	};
	ModerationCaseMessageDTO: {
		id?: number;
		fromModeration?: boolean;
		content?: string;
		creationDate?: string;
	};
	SanctionDTO: {
		type?: 'BAN' | 'MUTE' | 'TRADE';
		reason?: string;
		startsAt?: string;
		endsAt?: string;
	};
	AuctionRequest: { cardId: number; startPrice?: number; startsAt?: string; endsAt: string };
	ClaimedAchievementsDTO: { claimed?: Array<string> };
	GuildRequest: { name: string; joinPolicy: 'PUBLIC' | 'INVITE'; imagePageId?: number };
	GuildDTO: {
		id?: number;
		name?: string;
		imagePageId?: number;
		image?: string;
		joinPolicy?: 'PUBLIC' | 'INVITE';
		maxMembers?: number;
		nbMembers?: number;
		owner?: ApiSchemas['SimpleUserDTO'];
		member?: boolean;
		owned?: boolean;
		permissions?: Array<'INVITE' | 'KICK' | 'GRANT' | 'EDIT'>;
	};
	SendGuildMessageRequest: { content?: string; cardId?: number; pageId?: number };
	GuildMessageDTO: {
		id?: number;
		guildId?: number;
		fromUserId?: number;
		type?: 'TEXT' | 'TRADE' | 'CARD' | 'PAGE';
		content?: string;
		meta?: string;
		card?: ApiSchemas['ShowcaseCardDTO'];
		page?: ApiSchemas['PageDTO'];
		creationDate?: string;
	};
	PageDTO: {
		id?: number;
		title?: string;
		description?: string;
		image?: string;
		nsfw?: boolean;
		atk?: number;
		createdAt?: string;
		globalCount?: number;
		ownedCount?: number;
		friends?: Array<ApiSchemas['PageFriendDTO']>;
		variantIds?: Array<number>;
	};
	PageFriendDTO: { id?: number; name?: string; nbCards?: number };
	SendMessageRequest: { content: string };
	MessageDTO: {
		id?: number;
		conversationId?: number;
		fromUserId?: number;
		type?: 'TEXT' | 'TRADE' | 'CARD' | 'PAGE';
		content?: string;
		meta?: string;
		creationDate?: string;
	};
	OpenedBoosterDTO: { packId?: number; cards?: Array<ApiSchemas['CardDTO']> };
	BidRequest: { maxAmount?: number };
	MeRequest: {
		name: string;
		imagePageId?: number;
		nsfw?: boolean;
		safeWords?: Array<string>;
		visibility: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
		mutedNotifications: Array<'TRADE' | 'SALE' | 'FRIEND' | 'GUILD' | 'ACHIEVEMENT' | 'AUCTION'>;
	};
	BannerDTO: {
		id?: number;
		title?: string;
		message?: string;
		level?: 'INFO' | 'WARNING' | 'CRITICAL';
		link?: string;
		startsAt?: string;
		endsAt?: string;
	};
	MeDTO: {
		id?: number;
		name?: string;
		email?: string;
		roles?: Array<'USER' | 'ADMIN'>;
		imagePageId?: number;
		image?: string;
		nsfw?: boolean;
		safeWords?: Array<string>;
		money?: number;
		createdAt?: string;
		visibility?: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
		mutedNotifications?: Array<'TRADE' | 'SALE' | 'FRIEND' | 'GUILD' | 'ACHIEVEMENT' | 'AUCTION'>;
		rank?: number;
		banners?: Array<ApiSchemas['BannerDTO']>;
	};
	MeImageRequest: { imagePageId?: number };
	AuctionUpdateRequest: { startPrice?: number };
	WishlistsDTO: {
		owned?: Array<ApiSchemas['WishlistSummaryDTO']>;
		shared?: Array<ApiSchemas['WishlistSummaryDTO']>;
		pending?: Array<ApiSchemas['WishlistSummaryDTO']>;
	};
	WishlistDTO: { page?: ApiSchemas['PageDTO']; addedAt?: string };
	WishlistResult: {
		nbResults?: number;
		page?: number;
		sortBy?: 'ADDED_AT' | 'NAME';
		sortDirection?: 'ASC' | 'DESC';
		results?: Array<ApiSchemas['WishlistDTO']>;
	};
	WishlistFollowerDTO: {
		id?: number;
		name?: string;
		imagePageId?: number;
		image?: string;
		accepted?: boolean;
	};
	BoosterFamilyDTO: {
		family?: 'NORMAL' | 'PREMIUM' | 'PREMIUM_PLUS';
		available?: number;
		max?: number;
		bonus?: number;
		nextAvailableAt?: string;
	};
	BoosterSlotDTO: { id?: number; name?: string; pack?: ApiSchemas['PackDTO'] };
	BoostersDTO: {
		families?: Array<ApiSchemas['BoosterFamilyDTO']>;
		slots?: Array<ApiSchemas['BoosterSlotDTO']>;
	};
	GuildRefDTO: { id?: number; name?: string };
	PackDTO: {
		id?: number;
		name?: string;
		description?: string;
		image?: string;
		renderKey?: string;
		family?: 'NORMAL' | 'PREMIUM' | 'PREMIUM_PLUS';
		nbCards?: number;
		openAll?: boolean;
	};
	WelcomeCollectionDTO: { nbCards?: number; rank?: number; recent?: Array<ApiSchemas['CardDTO']> };
	WelcomeDTO: {
		boosters?: ApiSchemas['BoostersDTO'];
		pendingTrades?: number;
		pendingFriendRequests?: number;
		pendingGuildInvitations?: number;
		unreadNotifications?: number;
		unreadMessages?: number;
		collection?: ApiSchemas['WelcomeCollectionDTO'];
		pendingAuction?: number;
		guild?: ApiSchemas['GuildRefDTO'];
		money?: number;
	};
	VariantDTO: {
		id?: number;
		name?: string;
		color?: string;
		styles?: Array<'NORMAL' | 'FULL_ART' | 'CHROME'>;
		renderKey?: string;
	};
	ProfileTagDTO: { name?: string; color?: string };
	UserProfileDTO: {
		id?: number;
		name?: string;
		imagePageId?: number;
		image?: string;
		joinedAt?: string;
		lastConnection?: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'AWAY';
		full?: boolean;
		nbCards?: number;
		guild?: ApiSchemas['GuildRefDTO'];
		tags?: Array<ApiSchemas['ProfileTagDTO']>;
		showcase?: Array<ApiSchemas['ShowcaseLineDTO']>;
	};
	TradesDTO: {
		received?: Array<ApiSchemas['TradeDTO']>;
		sent?: Array<ApiSchemas['TradeDTO']>;
		done?: Array<ApiSchemas['TradeDTO']>;
	};
	SseEmitter: { timeout?: number };
	PagesResult: {
		nbResults?: number;
		page?: number;
		sortBy?: 'NAME' | 'RELEVANCE';
		sortDirection?: 'ASC' | 'DESC';
		results?: Array<ApiSchemas['PageDTO']>;
	};
	PackCatalogDTO: {
		id?: number;
		slotId?: number;
		position?: number;
		family?: 'NORMAL' | 'PREMIUM' | 'PREMIUM_PLUS';
		name?: string;
		description?: string;
		image?: string;
		renderKey?: string;
		status?: 'UPCOMING' | 'OPEN' | 'EXHAUSTED' | 'ENDED';
		startsAt?: string;
		endsAt?: string;
		nbCards?: number;
		openAll?: boolean;
		drawGroups?: Array<ApiSchemas['PackDrawGroupDTO']>;
	};
	PackDrawGroupDTO: { count?: number; variants?: Array<ApiSchemas['PackVariantDTO']> };
	PackPageDTO: {
		id?: number;
		title?: string;
		image?: string;
		maxCopies?: number;
		remainingCopies?: number;
	};
	PackVariantDTO: {
		variantId?: number;
		dropRate?: number;
		maxCopies?: number;
		remainingCopies?: number;
		pages?: Array<ApiSchemas['PackPageDTO']>;
	};
	NotificationDTO: {
		id?: number;
		type?:
			| 'TRADE_RECEIVED'
			| 'TRADE_COUNTERED'
			| 'TRADE_ACCEPTED'
			| 'TRADE_DECLINED'
			| 'TRADE_CANCELLED'
			| 'TRADE_EXPIRED'
			| 'SALE_SOLD'
			| 'SALE_CANCELLED'
			| 'FRIEND_REQUEST'
			| 'FRIEND_ACCEPTED'
			| 'GUILD_INVITE'
			| 'GUILD_JOINED'
			| 'GUILD_KICKED'
			| 'GUILD_PROMOTED'
			| 'GUILD_OWNER_CHANGED'
			| 'GUILD_DISBANDED'
			| 'ACHIEVEMENT_UNLOCKED'
			| 'MODERATION_CASE_OPENED'
			| 'MODERATION_MESSAGE'
			| 'AUCTION_OUTBID'
			| 'AUCTION_WON'
			| 'AUCTION_SOLD'
			| 'AUCTION_UNSOLD'
			| 'AUCTION_CANCELLED';
		actor?: ApiSchemas['SimpleUserDTO'];
		extId?: number;
		meta?: string;
		read?: boolean;
		creationDate?: string;
	};
	NotificationsResult: {
		results?: Array<ApiSchemas['NotificationDTO']>;
		nextCursor?: string;
		hasNext?: boolean;
		unread?: number;
	};
	GuildInvitationDTO: {
		guild?: ApiSchemas['GuildSummaryDTO'];
		inviterId?: number;
		inviterName?: string;
		invitedAt?: string;
	};
	GuildSummaryDTO: {
		id?: number;
		name?: string;
		imagePageId?: number;
		image?: string;
		joinPolicy?: 'PUBLIC' | 'INVITE';
		maxMembers?: number;
		nbMembers?: number;
	};
	MyBidsDTO: { escrowed?: number; auctions?: Array<ApiSchemas['AuctionDTO']> };
	AchievementDTO: {
		code?: string;
		category?: 'COLLECTION' | 'BOOSTER' | 'TRADE' | 'SALE' | 'SOCIAL' | 'MONEY' | 'AUCTION';
		name?: string;
		description?: string;
		threshold?: number;
		progress?: number;
		rewardMoney?: number;
		rewardBoosters?: Record<string, number>;
		unlockedAt?: string;
		claimedAt?: string;
	};
	LeaderboardDTO: {
		top?: Array<ApiSchemas['LeaderboardEntryDTO']>;
		around?: Array<ApiSchemas['LeaderboardEntryDTO']>;
		computedAt?: string;
		refreshAt?: string;
	};
	LeaderboardEntryDTO: {
		rank?: number;
		id?: number;
		name?: string;
		imagePageId?: number;
		image?: string;
		nbCards?: number;
	};
	GuildsResult: {
		nbResults?: number;
		page?: number;
		results?: Array<ApiSchemas['GuildSummaryDTO']>;
	};
	GuildMessagesResult: {
		results?: Array<ApiSchemas['GuildMessageDTO']>;
		nextCursor?: string;
		hasNext?: boolean;
	};
	GuildMemberDTO: {
		id?: number;
		name?: string;
		imagePageId?: number;
		image?: string;
		owner?: boolean;
		permissions?: Array<'INVITE' | 'KICK' | 'GRANT' | 'EDIT'>;
		joinedAt?: string;
	};
	GuildMembersResult: {
		nbResults?: number;
		page?: number;
		results?: Array<ApiSchemas['GuildMemberDTO']>;
	};
	GuildInviteeDTO: {
		id?: number;
		name?: string;
		imagePageId?: number;
		image?: string;
		invitedAt?: string;
	};
	FriendDTO: {
		id?: number;
		name?: string;
		imagePageId?: number;
		image?: string;
		createdAt?: string;
		lastConnection?: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'AWAY';
		sharesWishlist?: boolean;
	};
	FriendsDTO: {
		friends?: Array<ApiSchemas['FriendDTO']>;
		received?: Array<ApiSchemas['FriendDTO']>;
		sent?: Array<ApiSchemas['FriendDTO']>;
	};
	CollectionResult: {
		nbResults?: number;
		page?: number;
		sortBy?: 'ACQUIRED_DATE' | 'NAME';
		sortDirection?: 'ASC' | 'DESC';
		results?: Array<ApiSchemas['CardDTO']>;
		nextCursor?: string;
		hasNext?: boolean;
		q?: string;
	};
	ConversationDTO: {
		id?: number;
		user?: ApiSchemas['SimpleUserDTO'];
		lastMessage?: ApiSchemas['MessageDTO'];
		unread?: number;
	};
	ConversationsResult: {
		results?: Array<ApiSchemas['ConversationDTO']>;
		nextCursor?: string;
		hasNext?: boolean;
	};
	MessagesResult: {
		results?: Array<ApiSchemas['MessageDTO']>;
		nextCursor?: string;
		hasNext?: boolean;
	};
	BlockedUserDTO: {
		id?: number;
		name?: string;
		imagePageId?: number;
		image?: string;
		createdAt?: string;
	};
	AuctionsResult: { nbResults?: number; page?: number; results?: Array<ApiSchemas['AuctionDTO']> };
}
