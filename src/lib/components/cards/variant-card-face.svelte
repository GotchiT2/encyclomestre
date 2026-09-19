<script lang="ts">
	import EditionSigil from '$lib/components/boosters/preview/edition-sigil.svelte';
	import VariantEffects from '$lib/components/boosters/preview/variant-effects.svelte';
	import { nsfwFilterSettings, shouldBlurCardIllustration } from '$lib/content/nsfw-filter';
	import { cardHasStyle, cardNumberLabel, type CardRecord } from '$lib/types';

	let { card }: { card: CardRecord } = $props();
	const fullArt = $derived(cardHasStyle(card, 'FULL_ART'));
	const chrome = $derived(cardHasStyle(card, 'CHROME'));
	const effectsEnabled = $derived(fullArt || chrome || card.variant.renderKey !== 'standard');
	const serial = $derived(cardNumberLabel(card));
	const illustrationBlurred = $derived(shouldBlurCardIllustration(card, $nsfwFilterSettings));
	let landscape = $state(false);
	let failed = $state(false);
	let pointerX = $state(50);
	let pointerY = $state(50);
	let active = $state(false);

	function inspect(event: Event) {
		const image = event.currentTarget as HTMLImageElement;
		landscape = fullArt && image.naturalWidth / image.naturalHeight >= 1.2;
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
		void card.imageUrl;
		landscape = false;
		failed = false;
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
					onerror={() => (failed = true)}
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
		clip-path: polygon(6% 0, 94% 0, 100% 4%, 100% 96%, 94% 100%, 6% 100%, 0 96%, 0 4%);
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
			radial-gradient(ellipse at 22% 68%, #633c944f, transparent 45%),
			linear-gradient(145deg, #171636, #050916 66%);
		clip-path: polygon(12% 0, 88% 0, 100% 12%, 96% 82%, 86% 100%, 7% 96%, 0 76%, 4% 13%);
	}
	[data-render-key='arcade'] .shell {
		background:
			repeating-linear-gradient(0deg, transparent 0 7px, #82ffc90b 7px 8px),
			linear-gradient(145deg, #0e3a36, #050c19 62%);
		clip-path: polygon(
			10% 0,
			90% 0,
			90% 3%,
			97% 3%,
			97% 10%,
			100% 10%,
			100% 90%,
			97% 90%,
			97% 97%,
			90% 97%,
			90% 100%,
			10% 100%,
			10% 97%,
			3% 97%,
			3% 90%,
			0 90%,
			0 10%,
			3% 10%,
			3% 3%,
			10% 3%
		);
	}
	[data-render-key='neon'] .shell {
		background: linear-gradient(145deg, #24102c, #050a17 52%, #082b36);
		box-shadow: inset 0 0 20px #f165b938;
	}
	[data-render-key='comics'] .shell {
		background:
			radial-gradient(#ff8c7424 1px, transparent 1.4px) 0 0/6px 6px,
			linear-gradient(145deg, #55271f, #0b0b17 66%);
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
