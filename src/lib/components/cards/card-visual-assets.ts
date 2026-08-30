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
	'/images/templates/alt-legendaire.png',
	'/images/templates/commune.png',
	'/images/templates/legendaire.png',
	'/images/templates/peu-commune.png',
	'/images/templates/rare.png',
	'/images/templates/super-rare.png',
	'/images/templates/ultra-rare.png'
] as const;

export function preloadCardVisualAssets() {
	for (const source of cardVisualAssetUrls) {
		const image = new Image();
		image.src = source;
	}
}
