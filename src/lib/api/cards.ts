import type { CardRecord, ImageAttribution, VariantDefinition } from '$lib/types';
import { resolveVariant } from './variants';
import { wikiForgeUtcDate } from './wikiforge-contract';

export interface ImageAttributionDto {
	sourceUrl: string;
	author?: string | null;
	license?: string | null;
	licenseUrl?: string | null;
}

export interface WikiForgeCardDto {
	id: number;
	pageId: number;
	title: string;
	description?: string | null;
	image?: string | null;
	imageAttribution?: ImageAttributionDto | null;
	nsfw?: boolean;
	variantId: number;
	packId: number;
	serialNumber?: number | null;
	maxCopies?: number | null;
	atk?: number | null;
	duplicate?: boolean;
	protected?: boolean;
	tagIds?: number[] | null;
	acquiredDate?: string | null;
	creationDate?: string | null;
	pendingTradeId?: number | null;
	saleId?: number;
	auctionId?: number;
	ownedCount?: number;
	wishlists?: Array<{
		id: number;
		name: string;
		userId: number;
		userName: string;
	}>;
}

export function wikiForgeImageUrl(image?: string | null): string {
	return image?.trim() || '/card-placeholder.svg';
}

function imageAttribution(source?: ImageAttributionDto | null): ImageAttribution | undefined {
	if (!source?.sourceUrl) return;
	return {
		sourceUrl: source.sourceUrl,
		...(source.author ? { author: source.author } : {}),
		...(source.license ? { license: source.license } : {}),
		...(source.licenseUrl ? { licenseUrl: source.licenseUrl } : {})
	};
}

function optionalDate(value?: string | null) {
	if (!value) return undefined;
	const date = wikiForgeUtcDate(value);
	return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

export function toCardRecord(card: WikiForgeCardDto, variants: VariantDefinition[]): CardRecord {
	const variant = resolveVariant(variants, card.variantId);
	const attribution = imageAttribution(card.imageAttribution);
	return {
		id: String(card.id),
		catalogueId: String(card.pageId),
		baseCardId: card.pageId,
		variantId: card.variantId,
		variant,
		packId: card.packId,
		...(card.serialNumber == null ? {} : { serialNumber: card.serialNumber }),
		...(card.maxCopies == null ? {} : { maxCopies: card.maxCopies }),
		title: card.title,
		shortDescription: card.description ?? '',
		longDescription: card.description ?? '',
		imageUrl: wikiForgeImageUrl(card.image),
		...(attribution ? { imageAttribution: attribution } : {}),
		wikipediaUrl: `https://fr.wikipedia.org/?curid=${card.pageId}`,
		attack: card.atk ?? 0,
		defense: 0,
		ownedCount: card.ownedCount ?? 0,
		globalSupply: 0,
		friendsWhoOwn: [],
		acquiredAt: optionalDate(card.acquiredDate),
		createdAt: optionalDate(card.creationDate),
		collectionTagIds: (card.tagIds ?? []).map(String),
		duplicate: Boolean(card.duplicate),
		userProtected: Boolean(card.protected),
		pendingTradeId: card.pendingTradeId == null ? null : String(card.pendingTradeId),
		saleId: card.saleId == null ? null : String(card.saleId),
		activeAuctionId: card.auctionId == null ? null : String(card.auctionId),
		nsfw: Boolean(card.nsfw),
		sharedWishlistMemberships: (card.wishlists ?? []).map((wishlist) => ({
			id: String(wishlist.id),
			title: wishlist.name,
			defaultList: false,
			userId: String(wishlist.userId),
			userName: wishlist.userName
		}))
	};
}
