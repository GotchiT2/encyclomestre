export interface SaleListing {
	id: string;
	sellerId: string;
	cardId: string;
	price: number;
	currency: string;
	type: 'auction' | 'direct';
}
