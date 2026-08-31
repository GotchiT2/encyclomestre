/**
 * Cadres et textures locaux utilisés par `CardTile`.
 * Les précharger évite le clignotement du template au premier affichage de chaque rareté.
 */
export const cardVisualAssetUrls = [
	'/images/card-C-empty.png',
	'/images/card-KTD-empty.png',
	'/images/card-L---Overframe-empty.png',
	'/images/card-L-empty.png',
	'/images/card-PC-empty.png',
	'/images/card-R-empty.png',
	'/images/card-SR-empty.png',
	'/images/card-UR-empty.png',
	'/images/templates/alt-legendaire-v2.png',
	'/images/templates/commune-v2.png',
	'/images/templates/legendaire-v2.png',
	'/images/templates/peu-commune-v2.png',
	'/images/templates/rare-v2.png',
	'/images/templates/super-rare-v2.png',
	'/images/templates/ultra-rare-v2.png'
] as const;

export function preloadCardVisualAssets() {
	for (const source of cardVisualAssetUrls) {
		const image = new Image();
		image.src = source;
	}
}
