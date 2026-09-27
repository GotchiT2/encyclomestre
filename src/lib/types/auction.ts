import type { CardRecord } from './card';

export type AuctionStatus = 'OPEN' | 'SOLD' | 'UNSOLD' | 'CANCELLED' | (string & {});
export interface AuctionUser {
	id: string;
	name: string;
}
export interface AuctionBid {
	user?: AuctionUser | null;
	amount: number;
	auto: boolean;
	date: string;
}
export interface AuctionCard extends CardRecord {
	pageId: number;
	packId: number;
	serialNumber?: number;
	maxCopies?: number;
}
export interface Auction {
	id: string;
	seller: AuctionUser;
	card: AuctionCard;
	status: AuctionStatus;
	startPrice: number;
	price?: number;
	minBid: number;
	nbBids: number;
	leader?: AuctionUser | null;
	leaderId?: number;
	leading: boolean;
	myMax?: number;
	startsAt: string;
	endsAt: string;
	nbExtensions: number;
	closedAt?: string;
	bids?: AuctionBid[];
}
export interface AuctionPage {
	nbResults: number;
	page: number;
	results: Auction[];
}
export interface MyBids {
	escrowed: number;
	auctions: Auction[];
}
