import type { VitrineCard } from './vitrine-card';

/**
 * Contenu de démonstration figé pour la page de profil.
 *
 * Temporaire : aucune de ces valeurs ne vient de l'API et rien n'est modifiable
 * depuis l'écran. À remplacer par les données réelles quand les contrats seront
 * disponibles (nombre de cartes, guilde, ventes aux enchères, achat immédiat).
 */

const illustrations = [
	'/images/card-C-example.png',
	'/images/card-PC-example.png',
	'/images/card-R-example.png',
	'/images/card-SR-example.png',
	'/images/card-UR-example.png',
	'/images/card-L-example.png',
	'/images/card-L---Overframe-example.png',
	'/images/card-KTD-example.png'
];

function card(id: string, title: string, index: number): VitrineCard {
	return { id, title, imageUrl: illustrations[index % illustrations.length] };
}

export type PreviewSale = VitrineCard & {
	rarity: string;
	/** Prix courant pour une enchère, prix fixe pour un achat immédiat. */
	price: number;
	/** Enchères uniquement. */
	bids?: number;
	endsIn?: string;
};

export type PreviewShowcase = {
	id: string;
	title: string;
	perRow: number;
	cards: VitrineCard[];
};

export const previewProfile = {
	username: 'collectionneur-demo',
	avatarUrl: '/images/card-L-example.png',
	joinedOn: 'Mars 2026',
	guild: {
		name: 'Les Archivistes de Séoul',
		role: 'Conservatrice',
		members: 24
	},
	cardCount: 348,
	uniqueCount: 212,
	tags: ['K-pop', 'Full-art', 'Première édition', 'Holographique', 'Archives 2004']
};

export const previewAuctions: PreviewSale[] = [
	{
		...card('auc-1', "Girls' Generation", 5),
		rarity: 'L',
		price: 9500,
		bids: 14,
		endsIn: '2 h 15'
	},
	{
		...card('auc-2', 'Aespa · Variante holographique', 4),
		rarity: 'UR',
		price: 6120,
		bids: 8,
		endsIn: '6 h 40'
	},
	{
		...card('auc-3', 'Twice · Édition Codex', 3),
		rarity: 'SR',
		price: 3480,
		bids: 21,
		endsIn: '1 j 03 h'
	},
	{ ...card('auc-4', 'IU · Archives', 2), rarity: 'R', price: 1290, bids: 3, endsIn: '3 j 11 h' }
];

export const previewBuyNow: PreviewSale[] = [
	{ ...card('buy-1', '2NE1 · Première édition', 6), rarity: 'L', price: 12000 },
	{ ...card('buy-2', 'Wonder Girls', 1), rarity: 'PC', price: 780 },
	{ ...card('buy-3', 'KARA · Variante', 3), rarity: 'SR', price: 4250 },
	{ ...card('buy-4', 'SISTAR · Édition Codex', 0), rarity: 'C', price: 320 },
	{ ...card('buy-5', 'Le Sserafim · Archives', 7), rarity: 'UR', price: 5600 }
];

export const previewShowcases: PreviewShowcase[] = [
	{
		id: 'vit-1',
		title: 'Première génération',
		perRow: 5,
		cards: [
			card('v1-1', 'BoA', 0),
			card('v1-2', 'Seo Taiji and Boys', 1),
			card('v1-3', 'Gee', 2),
			card('v1-4', 'Wonder Girls', 3),
			card('v1-5', "Girls' Generation", 4),
			card('v1-6', '2NE1', 5),
			card('v1-7', 'KARA', 6),
			card('v1-8', 'SISTAR', 7)
		]
	},
	{
		id: 'vit-2',
		title: 'Légendaires',
		perRow: 4,
		cards: [
			card('v2-1', 'IU', 5),
			card('v2-2', 'Aespa', 6),
			card('v2-3', 'Twice', 4),
			card('v2-4', 'Hyuna', 3),
			card('v2-5', 'Vague coréenne', 5),
			card('v2-6', '(G)I-DLE', 6)
		]
	},
	{
		id: 'vit-3',
		title: 'Holographiques',
		perRow: 3,
		cards: [
			card('v3-1', 'Red Velvet', 2),
			card('v3-2', 'f(x)', 3),
			card('v3-3', 'Le Sserafim', 7),
			card('v3-4', 'NewJeans', 0)
		]
	},
	{
		id: 'vit-4',
		title: 'Pièce maîtresse',
		perRow: 1,
		cards: [card('v4-1', 'BLACKPINK · Première édition', 6)]
	}
];

/** Plafond de cartes exposées, toutes vitrines confondues. */
export const VITRINE_CARD_LIMIT = 20;

export function countShowcasedCards(showcases: PreviewShowcase[]) {
	return showcases.reduce((total, showcase) => total + showcase.cards.length, 0);
}
