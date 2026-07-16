import type { CardRarity, CardRecord } from '$lib/types';

type BaseArticle = [string, CardRarity, number, number, number];

const articles: BaseArticle[] = [
	["Girls' Generation", 'Légendaire', 9500, 9800, 2450000],
	['Blackpink', 'Légendaire', 9900, 9200, 5890000],
	['Twice (groupe)', 'Ultra-Rare', 8800, 8900, 1980000],
	['NewJeans', 'Super-Rare', 8200, 7800, 2210000],
	['Aespa', 'Super-Rare', 8500, 8000, 1850000],
	['IVE (groupe)', 'Super-Rare', 8000, 8100, 1390000],
	['IU (chanteuse)', 'Légendaire', 9300, 9900, 3120000],
	['2NE1', 'Ultra-Rare', 9100, 8200, 1420000],
	['Red Velvet', 'Ultra-Rare', 8600, 8700, 1150000],
	['Gee (chanson)', 'Rare', 7100, 6500, 890000],
	['Ddu-Du Ddu-Du', 'Rare', 7900, 6800, 1450000],
	['K-pop', 'Commune', 5000, 5000, 12500000],
	['Wonder Girls', 'Ultra-Rare', 8900, 8400, 780000],
	['KARA (groupe)', 'Ultra-Rare', 8700, 8300, 650000],
	['f(x) (groupe)', 'Ultra-Rare', 8600, 8500, 720000],
	['SISTAR', 'Rare', 8500, 8100, 540000],
	['MAMAMOO', 'Super-Rare', 8900, 8800, 980000],
	['(G)I-DLE', 'Super-Rare', 8800, 8200, 1670000],
	['Itzy', 'Super-Rare', 8300, 8400, 1210000],
	['Le Sserafim', 'Super-Rare', 8400, 7900, 1540000],
	['BoA (chanteuse)', 'Légendaire', 9400, 9500, 1340000],
	['Sunmi', 'Ultra-Rare', 8600, 8800, 870000],
	['Hyuna', 'Ultra-Rare', 8800, 8100, 1190000],
	['SM Entertainment', 'Commune', 5500, 4500, 940000],
	['Vague coréenne', 'Commune', 4800, 5200, 1100000]
];

const editions = ['', ' · Édition Codex', ' · Variante holographique', ' · Archives impériales'];
const imageUrls = [
	'https://upload.wikimedia.org/wikipedia/commons/2/23/220805_%EC%86%8C%EB%85%80%EC%8B%9C%EB%8C%80_%28SNSD%29.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/1/18/20240809_Blackpink_Pink_Carpet_09.png',
	'https://upload.wikimedia.org/wikipedia/commons/3/38/%ED%8C%8C%EB%A6%AC%EA%B2%8C%EC%9D%B4%EC%B8%A0_X_%ED%8A%B8%EC%99%80%EC%9D%B4%EC%8A%A4_TIME_TO_PG_MAGIC_23fall_TV_CF.png',
	'https://upload.wikimedia.org/wikipedia/commons/a/a2/NewJeans_X_OLENS_1_%28cropped%29.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/7/7c/241005_aespa_K-Link_Festival.jpg',
	'http://upload.wikimedia.org/wikipedia/commons/4/46/2023_MMA_IVE.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/IU_for_MelOn_Music_Awards_2021_04.jpg/440px-IU_for_MelOn_Music_Awards_2021_04.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/2NE1_Wordmark.svg/512px-2NE1_Wordmark.svg.png',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Red_Velvet_logo.svg/512px-Red_Velvet_logo.svg.png',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Gee_Logo.svg/512px-Gee_Logo.svg.png',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Ddu-Du_Ddu-Du_logo.svg/512px-Ddu-Du_Ddu-Du_logo.svg.png',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/K-pop_worldmark.svg/512px-K-pop_worldmark.svg.png'
];
const meta: Record<CardRarity, [CardRecord['rarityInitials'], string]> = {
	Commune: ['C', '#d3e4f8'],
	'Peu Commune': ['PC', '#1d71cf'],
	Rare: ['R', '#5c1dcf'],
	'Super-Rare': ['SR', '#b41dcf'],
	'Ultra-Rare': ['UR', '#cf7d1d'],
	Légendaire: ['L', '#cf1d1d']
};

export const mockCards: CardRecord[] = articles.flatMap(
	([title, rarity, attack, defense, viewCount], articleIndex) =>
		editions.flatMap((edition, editionIndex) => {
			const index = articleIndex + editionIndex * articles.length;
			const [rarityInitials, rarityColor] = meta[rarity];
			const baseCard: CardRecord = {
				id: `${title
					.toLowerCase()
					.normalize('NFD')
					.replace(/[\u0300-\u036f]/g, '')
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/^-|-$/g, '')}-${editionIndex + 1}`,
				baseCardId: index + 1,
				variant: 'NORMAL',
				title: `${title}${edition}`,
				shortDescription: `Notice encyclopédique de ${title}.`,
				longDescription: `${title} est une notice du compendium K-pop féminin, indexée pour la collection et les échanges entre amis.`,
				rarity,
				rarityInitials,
				rarityColor,
				viewCount: Math.round(viewCount * (1 + editionIndex * 0.03)),
				imageUrl: imageUrls[articleIndex % imageUrls.length],
				wikipediaUrl: `https://fr.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
				attack: Math.min(10000, Math.round(attack * (1 + editionIndex * 0.03))),
				defense: Math.min(10000, Math.round(defense * (1 + editionIndex * 0.03))),
				ownedCount: index % 7 === 0 ? (index % 3) + 1 : 0,
				isFullArt: false,
				globalSupply: Math.max(20, Math.round(1200 / (editionIndex + 1))),
				friendsWhoOwn:
					index === 0
						? [
								{
									friendId: 'friend-0',
									username: 'SoneS9',
									avatarUrl: '',
									ownedCount: 2
								}
							]
						: index % 3 === 0
							? []
							: [
									{
										friendId: `friend-${index % 6}`,
										username: [
											'SoneS9',
											'TaeyeonFan',
											'OnceForever',
											'MinjiStan',
											'UaenaCore',
											'RetroKpop'
										][index % 6],
										avatarUrl: '',
										ownedCount: (index % 3) + 1
									}
								]
			};
			return rarity === 'Légendaire'
				? [
						baseCard,
						{
							...baseCard,
							id: `${baseCard.id}-full-art`,
							variant: 'FULL_ART',
							isFullArt: true,
							ownedCount: 0
						}
					]
				: [baseCard];
		})
);
