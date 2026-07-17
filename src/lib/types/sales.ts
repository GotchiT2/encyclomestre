export interface SaleListing {
	id: string;
	sellerId: string;
	cardId: string;
	userCardId?: string;
	card?: import('./card').CardRecord;
	price: number;
	currentPrice?: number;
	minimumBid?: number;
	currency: string;
	type: 'auction' | 'direct';
	sellerName?: string;
	bidCount?: number;
	status?: 'active' | 'sold' | 'cancelled';
	createdAt?: string;
	endsAt?: string | null;
	closedAt?: string | null;
}

export type SaleState = 'ALL' | 'ACTIVE' | 'AVAILABLE';

export interface ActiveSaleSummary {
	id: string;
	type: SaleListing['type'];
	status: NonNullable<SaleListing['status']>;
	price: number;
	currentPrice: number;
	minimumBid: number;
	endsAt: string | null;
}

export interface CreateSaleInput {
	userCardId: string;
	type: SaleListing['type'];
	price: number;
	durationMinutes?: 1 | 10 | 60 | 180 | 360 | 720 | 1440;
}

export interface SaleBid {
	id: string;
	saleId: string;
	bidderName: string;
	bidderId?: string;
	amount: number;
	createdAt: string;
}
