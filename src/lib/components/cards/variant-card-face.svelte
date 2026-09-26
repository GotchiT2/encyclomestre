<script lang="ts">
	import { untrack } from 'svelte';
	import EditionSigil from '$lib/components/boosters/preview/edition-sigil.svelte';
	import VariantEffects from '$lib/components/boosters/preview/variant-effects.svelte';
	import { nsfwFilterSettings, shouldBlurCardIllustration } from '$lib/content/nsfw-filter';
	import { cardHasStyle, cardNumberLabel, type CardRecord } from '$lib/types';
	import { hasUsableCardImage, isLandscapeCardImage } from './card-image-orientation';

	let {
		card,
		onOrientationChange = () => undefined
	}: { card: CardRecord; onOrientationChange?: (landscape: boolean) => void } = $props();
	const fullArt = $derived(cardHasStyle(card, 'FULL_ART'));
	const chrome = $derived(cardHasStyle(card, 'CHROME'));
	const effectsEnabled = $derived(fullArt || chrome || card.variant.renderKey !== 'standard');
	const serial = $derived(cardNumberLabel(card));
	const illustrationBlurred = $derived(shouldBlurCardIllustration(card, $nsfwFilterSettings));
	let landscape = $state(false);
	let failed = $state(false);
	let inspectedImageUrl: string | null = null;
	let pointerX = $state(50);
	let pointerY = $state(50);
	let active = $state(false);

	function inspect(event: Event) {
		const image = event.currentTarget as HTMLImageElement;
		landscape =
			fullArt &&
			hasUsableCardImage(card.imageUrl) &&
			isLandscapeCardImage(image.naturalWidth, image.naturalHeight);
		onOrientationChange(landscape);
	}

	function move(event: PointerEvent) {
		if (!effectsEnabled) return;
		const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
		pointerX = ((event.clientX - bounds.left) / bounds.width) * 100;
		pointerY = ((event.clientY - bounds.top) / bounds.height) * 100;
		active = true;
	}

	function reset() {
		pointerX = pointerY = 50;
		active = false;
	}

	$effect(() => {
		const imageUrl = card.imageUrl;
		if (imageUrl === inspectedImageUrl) return;
		inspectedImageUrl = imageUrl;
		landscape = false;
		failed = false;
		untrack(() => onOrientationChange(false));
	});
</script>

<div
	class="variant-face"
	class:full-art={fullArt}
	class:landscape
	data-render-key={card.variant.renderKey}
	data-variant-id={card.variantId}
	data-orientation={landscape ? 'landscape' : 'portrait'}
	style={`--metal:${card.variant.color};--pointer-x:${pointerX};--pointer-y:${pointerY};--rx:${((pointerY - 50) * -0.045).toFixed(2)}deg;--ry:${((pointerX - 50) * 0.045).toFixed(2)}deg`}
	onpointermove={move}
	onpointerleave={reset}
	onpointerdown={(event) => event.pointerType !== 'mouse' && effectsEnabled && (active = true)}
	onpointerup={reset}
	onfocusin={() => effectsEnabled && (active = true)}
	onfocusout={reset}
	role="presentation"
>
	<div class="shell">
		<div class="engraving" aria-hidden="true"></div>
		<div class="art">
			{#if failed}
				<img src="/card-placeholder.svg" alt="" />
			{:else}
				<img
					src={card.imageUrl}
					alt=""
					class:blur-xl={illustrationBlurred}
					onload={inspect}
					onerror={() => {
						failed = true;
						landscape = false;
						onOrientationChange(false);
					}}
				/>
			{/if}
		</div>
		<div class="vignette" aria-hidden="true"></div>
		{#if effectsEnabled}
			<VariantEffects profile={card.variant.renderKey} {fullArt} {active} />
		{/if}
		<div class="name">{card.title}</div>
		{#if !fullArt}<p class="description">{card.shortDescription}</p>{/if}
		<div class="sigil"><EditionSigil key={card.variant.renderKey} /></div>
		{#if serial}<div class="serial">{serial}</div>{/if}
	</div>
</div>

<style>
	.variant-face {
		width: 100%;
		aspect-ratio: 862/1221;
		container-type: inline-size;
		perspective: 900px;
		filter: drop-shadow(0 14px 16px rgb(0 0 0 / 48%));
	}
	.variant-face.landscape {
		aspect-ratio: 1221/862;
	}
	.shell {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background:
			radial-gradient(
				circle at 50% 38%,
				color-mix(in srgb, var(--metal) 12%, transparent),
				transparent 45%
			),
			linear-gradient(145deg, #102945, #050c17 62%, #0b2136);
		border: 1px solid color-mix(in srgb, var(--metal) 82%, #bd6615);
		clip-path: polygon(4% 0, 96% 0, 100% 3%, 100% 97%, 96% 100%, 4% 100%, 0 97%, 0 3%);
		transform: rotateX(0) rotateY(0);
		transition: transform 180ms ease-out;
	}
	.variant-face:focus-within .shell,
	.variant-face:hover .shell {
		transform: rotateX(var(--rx)) rotateY(var(--ry)) translateY(-2px);
	}
	.shell::before,
	.shell::after {
		content: '';
		position: absolute;
		z-index: 5;
		inset: 2.8%;
		border: 1px solid color-mix(in srgb, var(--metal) 62%, transparent);
		clip-path: inherit;
		pointer-events: none;
	}
	.shell::after {
		inset: 4.2%;
		border-color: rgb(0 0 0 / 60%);
	}
	.art {
		position: absolute;
		z-index: 1;
		inset: 8% 7% 35%;
		overflow: hidden;
		background: #050b13;
		border: 1px solid color-mix(in srgb, var(--metal) 58%, transparent);
		clip-path: polygon(4% 0, 96% 0, 100% 4%, 100% 96%, 96% 100%, 4% 100%, 0 96%, 0 4%);
	}
	.art img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}
	.full-art .art {
		inset: 3.8%;
		border: 0;
	}
	.full-art .art img {
		object-fit: cover;
	}
	.full-art.landscape .art {
		inset: 6% 5% 19%;
		border: 1px solid color-mix(in srgb, var(--metal) 70%, transparent);
	}
	.full-art.landscape .art img {
		object-fit: contain;
	}
	.vignette {
		position: absolute;
		z-index: 2;
		inset: 0;
		background: linear-gradient(180deg, transparent 48%, rgb(2 7 15 / 20%) 62%, #040b18 91%);
		pointer-events: none;
	}
	.landscape .vignette {
		background: none;
	}
	.name {
		position: absolute;
		z-index: 7;
		right: 7%;
		bottom: 17.5%;
		left: 7%;
		display: flex;
		min-height: 11.5%;
		align-items: center;
		padding: 2.2% 12% 2.2% 5%;
		overflow: hidden;
		color: #f8e5af;
		background: linear-gradient(90deg, rgb(7 18 34 / 96%), rgb(12 34 54 / 90%));
		border: 1px solid color-mix(in srgb, var(--metal) 62%, #a14410);
		clip-path: polygon(4% 0, 96% 0, 100% 25%, 100% 75%, 96% 100%, 4% 100%, 0 75%, 0 25%);
		font: 700 clamp(0.58rem, 8cqw, 1.5rem)/1.05 var(--font-serif);
		text-shadow: 0 2px 5px #000;
	}
	.full-art .name {
		bottom: 8%;
		min-height: 13%;
	}
	.landscape .name {
		right: 24%;
		bottom: 5.5%;
		left: 5%;
		min-height: 10%;
		font-size: 5.4cqw;
	}
	.description {
		position: absolute;
		z-index: 7;
		right: 8%;
		bottom: 5.7%;
		left: 8%;
		display: -webkit-box;
		overflow: hidden;
		color: #bac9d6;
		font: 500 4.5cqw/1.25 var(--font-sans);
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}
	.sigil {
		position: absolute;
		z-index: 8;
		top: 4.5%;
		right: 4.5%;
		display: grid;
		width: 16%;
		aspect-ratio: 1;
		place-items: center;
		padding: 3.5%;
		color: var(--metal);
		background: radial-gradient(circle, #18344b, #07101f 68%);
		border: 1px solid var(--metal);
		transform: rotate(45deg);
	}
	.sigil :global(svg) {
		transform: rotate(-45deg);
	}
	.landscape .sigil {
		width: 10.5%;
		padding: 2.4%;
	}
	.serial {
		position: absolute;
		z-index: 8;
		right: 7%;
		bottom: 3%;
		padding: 1.5% 2.4%;
		color: var(--metal);
		background: #050d1ae8;
		border: 1px solid var(--metal);
		font: 700 4.8cqw/1 var(--font-title);
		font-variant-numeric: tabular-nums;
	}
	.landscape .serial {
		right: 4%;
		bottom: 5.8%;
		font-size: 3.7cqw;
	}
	.engraving {
		position: absolute;
		z-index: 3;
		inset: 0;
		pointer-events: none;
	}
	[data-render-key='chrome'] .engraving {
		background: linear-gradient(
			112deg,
			transparent 22%,
			#dff8ff28 27%,
			transparent 31%,
			transparent 62%,
			#fff0b828 67%,
			transparent 72%
		);
	}
	[data-render-key='nebula'] .shell {
		background:
			radial-gradient(circle at 18% 72%, #9a65e954, transparent 32%),
			radial-gradient(circle at 76% 20%, #5d8cff30, transparent 26%),
			linear-gradient(145deg, #211b4a, #050916 66%);
	}
	[data-render-key='nebula'] .engraving {
		background:
			radial-gradient(circle at 18% 22%, #fff 0 0.45%, transparent 0.7%),
			radial-gradient(circle at 72% 42%, #fff 0 0.35%, transparent 0.65%),
			radial-gradient(circle at 43% 78%, #cdb9ff 0 0.45%, transparent 0.8%);
		background-size:
			19% 23%,
			27% 31%,
			31% 29%;
		opacity: 0.7;
	}
	[data-render-key='arcade'] .shell {
		background:
			repeating-linear-gradient(0deg, transparent 0 7px, #82ffc90b 7px 8px),
			linear-gradient(145deg, #0e3a36, #050c19 62%);
	}
	[data-render-key='arcade'] .engraving {
		background:
			linear-gradient(90deg, transparent 48%, #8df5b422 49% 51%, transparent 52%),
			linear-gradient(0deg, transparent 48%, #8df5b416 49% 51%, transparent 52%);
		background-size: 18px 18px;
	}
	[data-render-key='neon'] .shell {
		background:
			radial-gradient(circle at 82% 18%, #4eeaff38, transparent 34%),
			linear-gradient(145deg, #35113e, #050a17 52%, #07323b);
		box-shadow: inset 0 0 28px #f165b94a;
	}
	[data-render-key='neon'] .engraving {
		background: linear-gradient(
			118deg,
			transparent 20%,
			#ed6fa34a 21% 22%,
			transparent 23% 62%,
			#50e9ff42 63% 64%,
			transparent 65%
		);
	}
	[data-render-key='comics'] .shell {
		background:
			radial-gradient(#ff8c7424 1px, transparent 1.4px) 0 0/6px 6px,
			linear-gradient(145deg, #55271f, #0b0b17 66%);
	}
	[data-render-key='comics'] .engraving {
		background: repeating-linear-gradient(135deg, transparent 0 12px, #fff0cf12 12px 14px);
	}
	[data-render-key='comics'] .name {
		color: #151b2c;
		background: #fff0cf;
		border: 3px solid #191624;
		text-shadow: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.shell,
		.variant-face:hover .shell,
		.variant-face:focus-within .shell {
			transform: none;
			transition: none;
		}
	}
</style>
