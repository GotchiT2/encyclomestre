let fonts: Promise<string> | undefined;

/** SVG images cannot inherit the document's fonts. Embed our local fonts in GPU textures. */
export async function boosterTextureArtwork(svg: string) {
	fonts ??= Promise.all(
		['Barlow-SemiBold', 'BarlowCondensed-Black'].map(async (name) => {
			const response = await fetch(`/fonts/arcade/${name}.ttf`);
			if (!response.ok) throw new Error('BOOSTER_FONT_UNAVAILABLE');
			const blob = await response.blob();
			const data = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(String(reader.result));
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});
			return `@font-face{font-family:'${name.startsWith('BarlowCondensed') ? 'Barlow Condensed' : 'Barlow'}';src:url('${data}');font-weight:400 900;}`;
		})
	)
		.then((styles) => `<style>${styles.join('')}</style>`)
		.catch((error) => {
			fonts = undefined;
			throw error;
		});
	return svg.replace('<defs>', `<defs>${await fonts}`);
}
