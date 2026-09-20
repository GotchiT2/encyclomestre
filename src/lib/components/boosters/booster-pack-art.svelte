<script lang="ts">
	import EditionSigil from './preview/edition-sigil.svelte';

	let {
		name,
		renderKey,
		cardCount,
		imageUrl
	}: { name: string; renderKey: string; cardCount: number; imageUrl?: string } = $props();
	let imageFailed = $state(false);

	const colors: Record<string, string> = {
		standard: '#c88a45',
		chrome: '#b1cff2',
		nebula: '#b69aff',
		arcade: '#8df5b4',
		neon: '#ed6fa3',
		comics: '#ff857c'
	};
	const color = $derived(colors[renderKey] ?? colors.standard);
	$effect(() => {
		void imageUrl;
		imageFailed = false;
	});
</script>

<div class="pack" data-theme={renderKey} style={`--pack-color:${color}`} aria-hidden="true">
	{#if imageUrl && !imageFailed}
		<img src={imageUrl} alt="" onerror={() => (imageFailed = true)} />
	{:else}
		<div class="rays"></div>
		<div class="frame"></div>
		<div class="texture"></div>
		<p class="edition">{name}</p>
		<p class="brand">WikiForge</p>
		<div class="rule"><span></span><i></i><span></span></div>
		<div class="sigil"><EditionSigil key={renderKey} /></div>
		<p class="count"><strong>{cardCount}</strong><span>cartes</span></p>
	{/if}
</div>

<style>
	.pack {
		position: relative;
		width: 100%;
		aspect-ratio: 862 / 1221;
		overflow: hidden;
		isolation: isolate;
		color: var(--pack-color);
		background:
			radial-gradient(
				circle at 50% 49%,
				color-mix(in srgb, var(--pack-color) 18%, transparent),
				transparent 28%
			),
			linear-gradient(145deg, #123349, #071525 60%, #030a13);
		border: 1px solid color-mix(in srgb, var(--pack-color) 75%, #c57730);
		clip-path: polygon(
			0 0,
			100% 0,
			98% 5%,
			100% 10%,
			98% 90%,
			100% 95%,
			100% 100%,
			0 100%,
			2% 95%,
			0 90%,
			2% 10%,
			0 5%
		);
		box-shadow: 0 1rem 2rem rgb(0 0 0 / 45%);
	}
	.pack > img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		background: #061526;
	}
	.pack::before,
	.pack::after {
		position: absolute;
		right: 0;
		left: 0;
		z-index: 4;
		height: 4%;
		content: '';
		background: repeating-linear-gradient(
			90deg,
			#020813 0 3px,
			var(--pack-color) 3px 4px,
			#020813 4px 7px
		);
	}
	.pack::before {
		top: 0;
	}
	.pack::after {
		bottom: 0;
	}
	.frame {
		position: absolute;
		inset: 6% 5%;
		border: 1px solid currentColor;
		box-shadow:
			inset 0 0 0 4px #07111d,
			inset 0 0 0 5px color-mix(in srgb, var(--pack-color) 55%, transparent);
	}
	.texture {
		position: absolute;
		inset: 0;
		opacity: 0.42;
		background: repeating-conic-gradient(
			from 0deg at 50% 52%,
			transparent 0 3deg,
			color-mix(in srgb, var(--pack-color) 15%, transparent) 3.2deg 3.5deg
		);
	}
	.rays {
		position: absolute;
		inset: 0;
		background: repeating-conic-gradient(
			from 12deg at 50% 54%,
			transparent 0 7deg,
			color-mix(in srgb, var(--pack-color) 13%, transparent) 7.5deg 8deg
		);
		mask-image: radial-gradient(circle, black, transparent 74%);
	}
	.edition,
	.brand,
	.count,
	.rule,
	.sigil {
		position: absolute;
		z-index: 2;
	}
	.edition {
		top: 8%;
		right: 10%;
		left: 10%;
		text-align: center;
		font: 700 clamp(0.58rem, 6.4cqw, 1.15rem)/1 var(--font-heading);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.brand {
		top: 25%;
		right: 5%;
		left: 5%;
		text-align: center;
		font: 700 clamp(1.1rem, 13cqw, 2.8rem)/0.9 var(--font-title);
		color: #fff0ce;
		text-shadow:
			0 3px #682908,
			0 0 18px color-mix(in srgb, var(--pack-color) 38%, transparent);
	}
	.rule {
		top: 48%;
		right: 18%;
		left: 18%;
		display: flex;
		align-items: center;
		gap: 8%;
	}
	.rule span {
		height: 1px;
		flex: 1;
		background: currentColor;
	}
	.rule i {
		width: 9%;
		aspect-ratio: 1;
		border: 1px solid currentColor;
		transform: rotate(45deg);
	}
	.sigil {
		top: 57%;
		left: 50%;
		width: 24%;
		aspect-ratio: 1;
		padding: 5%;
		transform: translateX(-50%) rotate(45deg);
		border: 1px solid currentColor;
		background: #071525;
		box-shadow: 0 0 1.4rem color-mix(in srgb, var(--pack-color) 30%, transparent);
	}
	.sigil :global(svg) {
		transform: rotate(-45deg);
	}
	.count {
		right: 11%;
		bottom: 8%;
		left: 11%;
		padding: 5% 0;
		text-align: center;
		font: 700 9cqw/1 var(--font-heading);
		border: 1px solid currentColor;
		background: rgb(3 10 19 / 80%);
	}
	.count span {
		display: block;
		margin-top: 0.18em;
		font: 700 3.8cqw/1 var(--font-sans);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	[data-theme='chrome'] {
		background: linear-gradient(145deg, #31475b, #07111d 58%, #263b50);
	}
	[data-theme='nebula'] {
		background: radial-gradient(circle at 30% 48%, #633b9466, transparent 42%), #070d24;
	}
	[data-theme='arcade'] {
		background: repeating-linear-gradient(0deg, transparent 0 3px, #8df5b410 3px 4px), #061b22;
	}
	[data-theme='neon'] {
		background:
			radial-gradient(circle at 30% 52%, #ed6fa34d, transparent 45%),
			linear-gradient(145deg, #200d2b, #04121b);
	}
	[data-theme='comics'] {
		background:
			radial-gradient(#ff857c24 1px, transparent 1px) 0 0 / 5px 5px,
			#251315;
	}
</style>
