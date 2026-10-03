<script lang="ts">
	import Brand from '../brand/brand.svelte';
	import { brandName } from '../brand/artwork.js';
	let {
		name,
		renderKey = 'standard',
		cardCount,
		imageUrl,
		labels
	}: {
		name: string;
		renderKey?: string;
		cardCount?: number;
		imageUrl?: string;
		labels: { brand: string; cards: string };
	} = $props();
	let failed = $state(false);
	const illustration = $derived(imageUrl?.includes('/images/booster') ? undefined : imageUrl);
	const accents: Record<string, string> = {
		standard: '#E8EF42',
		chrome: '#B9D4DF',
		nebula: '#D89CF1',
		arcade: '#6BC4B0',
		neon: '#F48AC4',
		comics: '#EA8D71'
	};
	const accent = $derived(accents[renderKey] ?? '#E8EF42');
	$effect(() => {
		void imageUrl;
		failed = false;
	});
</script>

<div
	class="arcade-pack"
	style={`--pack-accent:${accent}`}
	data-theme={renderKey}
	aria-hidden="true"
>
	<div class="pack-top"></div>
	<div class="pack-bottom"></div>
	{#if illustration && !failed}<img
			src={illustration}
			alt=""
			onerror={() => (failed = true)}
		/>{:else}
		<div class="pack-graphic">
			<Brand kind="symbol" />
		</div>
	{/if}
	<div class="pack-caption">
		<span class="pack-brand"
			>{#if labels.brand === brandName}<Brand kind="wordmark" />{:else}{labels.brand}{/if}</span
		><strong>{name}</strong>{#if cardCount != null}<span class="pack-count"
				>{cardCount} {labels.cards}</span
			>{/if}
	</div>
</div>

<style>
	.arcade-pack {
		aspect-ratio: 1/1.416;
		width: 100%;
		position: relative;
		container-type: inline-size;
		overflow: hidden;
		isolation: isolate;
		background: #171918;
		color: var(--pack-accent);
		border: 1px solid var(--pack-accent);
		clip-path: polygon(
			2% 0,
			98% 0,
			100% 3%,
			98% 6%,
			100% 9%,
			100% 91%,
			98% 94%,
			100% 97%,
			98% 100%,
			2% 100%,
			0 97%,
			2% 94%,
			0 91%,
			0 9%,
			2% 6%,
			0 3%
		);
	}
	.pack-top,
	.pack-bottom {
		position: absolute;
		inset-inline: 0;
		height: 4%;
		z-index: 4;
		background: repeating-linear-gradient(90deg, var(--pack-accent) 0 1px, #171918 1px 4px);
	}
	.pack-top {
		top: 0;
	}
	.pack-bottom {
		bottom: 0;
	}
	img {
		position: absolute;
		width: 100%;
		height: 100%;
		object-fit: cover;
		inset: 0;
		opacity: 0.65;
	}
	.pack-graphic {
		position: absolute;
		inset: 10% 9% 35%;
		display: grid;
		place-items: center;
		background: repeating-linear-gradient(135deg, transparent 0 12px, #efebd90a 12px 13px);
		border: 1px solid #efebd966;
	}
	.pack-graphic :global(.wikiforge-brand) {
		width: 80%;
		height: 80%;
	}
	.pack-caption {
		position: absolute;
		inset: auto 5% 7%;
		padding: 4cqw;
		background: var(--pack-accent);
		color: #171918;
		display: grid;
		gap: 3cqw;
		border-left: 2cqw solid #171918;
	}
	.pack-caption strong {
		font:
			900 clamp(18px, 13cqw, 45px)/0.9 'Barlow Condensed',
			sans-serif;
		text-transform: uppercase;
		overflow-wrap: anywhere;
	}
	.pack-brand {
		font:
			600 6cqw 'Barlow',
			sans-serif;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.pack-count {
		font:
			600 5cqw 'Barlow',
			sans-serif;
	}
</style>
