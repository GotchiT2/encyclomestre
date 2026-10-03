import type { CardRecord, VariantDefinition } from '$lib/types';
import { cardDefinition } from '$lib/card-renderer/card-presets';
import { serializeRenderKey } from '$lib/card-renderer/render-key';

const mockVariants: VariantDefinition[] = [
	{
		id: 1,
		name: 'Standard',
		color: '#b8f2d5',
		styles: ['NORMAL'],
		renderKey: serializeRenderKey(cardDefinition(false))
	},
	{
		id: 2,
		name: 'Full art',
		color: '#ffe144',
		styles: ['FULL_ART'],
		renderKey: serializeRenderKey(cardDefinition(true))
	},
	{
		id: 3,
		name: 'Chrome',
		color: '#b1cff2',
		styles: ['CHROME'],
		renderKey: serializeRenderKey(cardDefinition(false, 'chrome'))
	},
	{
		id: 4,
		name: 'Chrome full art',
		color: '#fa9931',
		styles: ['FULL_ART', 'CHROME'],
		renderKey: serializeRenderKey(cardDefinition(true, 'chrome'))
	}
];

const articles = [
	"Girls' Generation",
	'Blackpink',
	'Twice (groupe)',
	'NewJeans',
	'Aespa',
	'IVE (groupe)',
	'IU (chanteuse)',
	'2NE1',
	'Red Velvet',
	'Gee (chanson)',
	'Ddu-Du Ddu-Du',
	'Seo Taiji and Boys',
	'K-pop',
	'Wonder Girls',
	'KARA (groupe)',
	'f(x) (groupe)',
	'SISTAR',
	'MAMAMOO',
	'(G)I-DLE',
	'Itzy',
	'Le Sserafim',
	'BoA (chanteuse)',
	'Sunmi',
	'Hyuna',
	'SM Entertainment',
	'Vague coréenne'
];

const imageUrls = [
	'https://upload.wikimedia.org/wikipedia/commons/2/23/220805_%EC%86%8C%EB%85%80%EC%8B%9C%EB%8C%80_%28SNSD%29.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/1/18/20240809_Blackpink_Pink_Carpet_09.png',
	'https://upload.wikimedia.org/wikipedia/commons/3/38/%ED%8C%8C%EB%A6%AC%EA%B2%8C%EC%9D%B4%EC%B8%A0_X_%ED%8A%B8%EC%99%80%EC%9D%B4%EC%8A%A4_TIME_TO_PG_MAGIC_23fall_TV_CF.png',
	'https://upload.wikimedia.org/wikipedia/commons/a/a2/NewJeans_X_OLENS_1_%28cropped%29.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/7/7c/241005_aespa_K-Link_Festival.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/4/46/2023_MMA_IVE.jpg'
];

const slug = (value: string) =>
	value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

export const mockCards: CardRecord[] = articles.flatMap((title, articleIndex) =>
	mockVariants.map((variant, variantIndex) => {
		const index = articleIndex * mockVariants.length + variantIndex;
		return {
			id: `${slug(title)}-${variant.id}`,
			baseCardId: articleIndex + 1,
			catalogueId: String(articleIndex + 1),
			variantId: variant.id,
			variant,
			packId: variant.id > 2 ? 2 : 1,
			...(variant.id === 4 ? { serialNumber: (articleIndex % 99) + 1, maxCopies: 99 } : {}),
			title,
			shortDescription: `Notice encyclopédique de ${title}.`,
			longDescription: `${title} est une notice du compendium WikiForge.`,
			imageUrl: imageUrls[articleIndex % imageUrls.length],
			wikipediaUrl: `https://fr.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
			attack: 5000 + articleIndex * 170,
			defense: 5000 + articleIndex * 140,
			ownedCount: index % 7 === 0 ? (index % 3) + 1 : 0,
			globalSupply: Math.max(20, 1200 - index * 8),
			friendsWhoOwn:
				index % 3 === 0
					? []
					: [
							{
								friendId: `friend-${index % 6}`,
								username: 'Collectionneur',
								avatarUrl: '',
								ownedCount: 1
							}
						]
		};
	})
);

export { mockVariants };
