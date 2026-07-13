export interface SaleListing {
	id: string;
	sellerId: string;
	cardId: string;
	price: number;
	currency: string;
	type: 'auction' | 'direct';
	sellerName?: string;
	bidCount?: number;
	status?: 'active' | 'sold' | 'cancelled';
}

export interface SaleBid {
	id: string;
	saleId: string;
	bidderName: string;
	amount: number;
	createdAt: string;
}
