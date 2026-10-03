<script lang="ts">
	import { _ } from '$lib/i18n';
	import Brand from '$lib/brand/brand.svelte';
	import EditionSigil from './edition-sigil.svelte';
	import VariantEffects from './variant-effects.svelte';
	import { getSubject, getVariant, isLandscapeCard, type PreviewCard } from './catalogue';

	let {
		card,
		onOpen,
		missingImage = false,
		decorative = false
	}: {
		card: PreviewCard;
		onOpen?: (card: PreviewCard) => void;
		missingImage?: boolean;
		decorative?: boolean;
	} = $props();

	const subject = $derived(getSubject(card.subjectId));
	const variant = $derived(getVariant(card.variantId));
	const fullArt = $derived(variant.styles.includes('FULL_ART'));
	const effectsEnabled = $derived(fullArt || variant.styles.includes('CHROME'));
	const landscape = $derived(isLandscapeCard(card));
	const serialLabel = $derived(
		variant.printRun ? `${card.serial?.number ?? 'X'}/${variant.printRun}` : ''
	);
	let failed = $state(false);
	let pointerX = $state(50);
	let pointerY = $state(50);
	let activeInteraction = $state(false);

	function updateInteraction(event: PointerEvent) {
		if (!effectsEnabled) return;
		const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
		pointerX = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
		pointerY = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100));
		activeInteraction = true;
	}

	function resetInteraction() {
		pointerX = 50;
		pointerY = 50;
		activeInteraction = false;
	}

	$effect(() => {
		void subject.image;
		void missingImage;
		failed = false;
	});
</script>

<button
	type="button"
	class="variant-card"
	class:full-art={fullArt}
	class:landscape
	class:effects-enabled={effectsEnabled}
	class:effects-active={effectsEnabled && activeInteraction}
	class:long-title={subject.title.length > 30}
	data-theme={variant.renderKey}
	data-orientation={landscape ? 'landscape' : 'portrait'}
	data-image-mode={subject.imageMode}
	data-variant-id={variant.id}
	data-testid="preview-card"
	data-effect-active={effectsEnabled && activeInteraction}
	style={`--metal:${variant.color};--focal-point:${subject.focalPoint ?? '50% 50%'};--logo-background:${subject.logoBackground ?? '#f5efd9'};--pointer-x:${pointerX.toFixed(2)};--pointer-y:${pointerY.toFixed(2)};--rotate-x:${((pointerY - 50) * -0.045).toFixed(2)}deg;--rotate-y:${((pointerX - 50) * 0.045).toFixed(2)}deg`}
	onclick={() => onOpen?.(card)}
	onpointermove={updateInteraction}
	onpointerdown={(event) => {
		if (effectsEnabled && event.pointerType !== 'mouse') activeInteraction = true;
	}}
	onpointerleave={resetInteraction}
	onpointerup={resetInteraction}
	onpointercancel={resetInteraction}
	onfocus={() => {
		if (effectsEnabled) activeInteraction = true;
	}}
	onblur={resetInteraction}
	tabindex={decorative ? -1 : 0}
	aria-hidden={decorative ? true : undefined}
	aria-label={$_('boosterPreview.card_label', {
		values: { title: subject.title, variant: variant.name, serial: serialLabel }
	})}
>
	<span class="card-shell">
		<span class="engraving" aria-hidden="true"></span>
		<span class="inner-rail" aria-hidden="true"></span>
		{#if !failed && !missingImage}
			<span class="art-window">
				<img
					class="subject-image"
					src={subject.image}
					alt=""
					loading="lazy"
					onerror={() => (failed = true)}
				/>
			</span>
		{:else}
			<span class="image-fallback"
				><span aria-hidden="true">◇</span>{$_('boosterPreview.image_missing')}</span
			>
		{/if}
		<span class="image-vignette" aria-hidden="true"></span>
		{#if effectsEnabled}<VariantEffects
				profile={variant.renderKey}
				{fullArt}
				active={activeInteraction}
			/>{/if}
		{#if !fullArt}<span class="face-description"
				>{$_(`boosterPreview.subjects.${subject.descriptionKey}`)}</span
			>{/if}
		<span class="name-cartouche"><span>{subject.title}</span></span>
		<span class="edition-seal" data-testid="edition-sigil"
			><EditionSigil key={variant.renderKey} /></span
		>
		<span class="brand-diamond" aria-hidden="true"><Brand kind="symbol" compact monochrome /></span>
		{#if serialLabel}<span class="serial-engraving">{serialLabel}</span>{/if}
	</span>
</button>

<style>
	.variant-card {
		container-type: inline-size;
		position: relative;
		display: block;
		width: 100%;
		aspect-ratio: 862 / 1221;
		padding: 0;
		color: #f8e5af;
		text-align: left;
		background: transparent;
		border: 0;
		filter: drop-shadow(0 14px 18px rgb(0 0 0 / 48%));
		cursor: pointer;
		isolation: isolate;
		transition: transform 180ms ease-out;
	}
	.variant-card.landscape {
		aspect-ratio: 1221 / 862;
	}
	.variant-card:focus-visible {
		outline: 3px solid var(--energy-soft);
		outline-offset: 5px;
	}
	.variant-card.effects-enabled:hover {
		transform: translateY(-3px);
	}
	.variant-card.effects-active {
		transform: perspective(900px) translateY(-3px) rotateX(var(--rotate-x)) rotateY(var(--rotate-y));
	}
	.card-shell {
		position: absolute;
		inset: 0;
		display: block;
		overflow: hidden;
		background:
			radial-gradient(
				circle at 50% 44%,
				color-mix(in srgb, var(--metal) 12%, transparent),
				transparent 48%
			),
			linear-gradient(145deg, #102945, #06101f 58%, #0b2136);
		border: 1px solid color-mix(in srgb, var(--metal) 88%, #d98213);
		clip-path: polygon(6% 0, 94% 0, 100% 4.2%, 100% 95.8%, 94% 100%, 6% 100%, 0 95.8%, 0 4.2%);
	}
	.card-shell::before,
	.card-shell::after {
		position: absolute;
		z-index: 5;
		inset: 2.4%;
		content: '';
		border: 1px solid color-mix(in srgb, var(--metal) 62%, transparent);
		clip-path: polygon(5% 0, 95% 0, 100% 4%, 100% 96%, 95% 100%, 5% 100%, 0 96%, 0 4%);
		pointer-events: none;
	}
	.card-shell::after {
		inset: 3.8%;
		border-color: rgb(0 0 0 / 58%);
	}
	.inner-rail {
		position: absolute;
		z-index: 4;
		inset: 5%;
		border: 1px solid color-mix(in srgb, var(--metal) 28%, transparent);
		clip-path: polygon(4% 0, 96% 0, 100% 3%, 100% 97%, 96% 100%, 4% 100%, 0 97%, 0 3%);
		pointer-events: none;
	}
	.art-window {
		position: absolute;
		z-index: 1;
		inset: 8% 7% 35%;
		display: grid;
		place-items: center;
		overflow: hidden;
		background: #07101d;
		border: 1px solid color-mix(in srgb, var(--metal) 58%, #6f2607);
		clip-path: polygon(4% 0, 96% 0, 100% 4%, 100% 96%, 96% 100%, 4% 100%, 0 96%, 0 4%);
	}
	.subject-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: var(--focal-point);
	}
	[data-image-mode='landscape']:not(.full-art) .subject-image {
		object-fit: contain;
	}
	[data-image-mode='logo'] .art-window {
		padding: 7%;
		background: var(--logo-background);
	}
	[data-image-mode='logo'] .subject-image {
		object-fit: contain;
	}
	.full-art:not([data-image-mode='logo']) .art-window {
		inset: 3.8%;
		border: 0;
		clip-path: polygon(3% 0, 97% 0, 100% 3%, 100% 97%, 97% 100%, 3% 100%, 0 97%, 0 3%);
	}
	.full-art {
		filter: drop-shadow(0 18px 24px rgb(0 0 0 / 58%))
			drop-shadow(0 0 9px color-mix(in srgb, var(--metal) 23%, transparent));
	}
	.full-art.landscape .art-window {
		inset: 8% 5% 19%;
		background: #03070c;
		border: 1px solid color-mix(in srgb, var(--metal) 70%, transparent);
	}
	.full-art.landscape[data-image-mode='logo'] .art-window {
		inset: 6% 5% 18%;
		padding: 7%;
		background:
			radial-gradient(
				circle at 50% 45%,
				color-mix(in srgb, var(--metal) 15%, transparent),
				transparent 55%
			),
			var(--logo-background);
	}
	.full-art.landscape .subject-image {
		object-fit: contain;
	}
	.image-vignette {
		position: absolute;
		z-index: 2;
		inset: 0;
		background: linear-gradient(180deg, transparent 48%, rgb(2 7 15 / 20%) 62%, #040b18 91%);
		pointer-events: none;
	}
	.full-art.landscape .image-vignette,
	[data-image-mode='logo'] .image-vignette {
		background: none;
	}
	.name-cartouche {
		position: absolute;
		z-index: 7;
		right: 7%;
		bottom: 8.2%;
		left: 7%;
		display: flex;
		min-height: 13%;
		align-items: center;
		padding: 3% 12% 3% 5%;
		background: linear-gradient(90deg, rgb(7 18 34 / 96%), rgb(12 34 54 / 90%));
		border: 1px solid color-mix(in srgb, var(--metal) 62%, #a14410);
		clip-path: polygon(4% 0, 96% 0, 100% 25%, 100% 75%, 96% 100%, 4% 100%, 0 75%, 0 25%);
	}
	.variant-card:not(.full-art) .name-cartouche {
		bottom: 17.5%;
		min-height: 11.5%;
		padding-block: 2.2%;
	}
	.face-description {
		position: absolute;
		z-index: 7;
		right: 8%;
		bottom: 5.7%;
		left: 8%;
		display: -webkit-box;
		overflow: hidden;
		font: 500 4.6cqw / 1.25 var(--font-sans);
		letter-spacing: 0.01em;
		color: #bac9d6;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}
	.name-cartouche span {
		display: block;
		font: 700 8.4cqw / 1.06 var(--font-serif);
		text-wrap: balance;
		text-shadow: 0 2px 5px #000;
	}
	.long-title .name-cartouche span {
		font-size: 5.6cqw;
		line-height: 1.13;
	}
	.landscape .name-cartouche {
		right: 24%;
		bottom: 5.5%;
		left: 5%;
		min-height: 10%;
		padding: 1.5% 5%;
	}
	.landscape .name-cartouche span {
		font-size: 5.4cqw;
	}
	.landscape.long-title .name-cartouche span {
		font-size: 3.7cqw;
	}
	.edition-seal {
		position: absolute;
		z-index: 8;
		top: 4.2%;
		right: 4.5%;
		display: grid;
		width: 16%;
		aspect-ratio: 1;
		place-items: center;
		padding: 3.6%;
		color: var(--metal);
		background: radial-gradient(circle, #18344b, #07101f 68%);
		border: 1px solid color-mix(in srgb, var(--metal) 72%, #b85d0d);
		box-shadow:
			inset 0 0 0 2px #050b15,
			0 0 12px color-mix(in srgb, var(--metal) 18%, transparent);
		transform: rotate(45deg);
	}
	.edition-seal :global(svg) {
		transform: rotate(-45deg);
	}
	.landscape .edition-seal {
		width: 10.5%;
		top: 5%;
		right: 3.5%;
		padding: 2.4%;
	}
	.brand-diamond {
		position: absolute;
		z-index: 8;
		bottom: 1.3%;
		left: 50%;
		display: grid;
		width: 8%;
		aspect-ratio: 1;
		place-items: center;
		color: #e8ef42;
		background: #171918;
		border: 1px solid #e8ef42;
		padding: 0.7%;
		transform: translateX(-50%);
	}
	.landscape .brand-diamond {
		width: 5%;
		bottom: 1.5%;
	}
	.serial-engraving {
		position: absolute;
		z-index: 8;
		right: 7%;
		bottom: 3.2%;
		padding: 1.6% 2.4%;
		font: 700 4.8cqw / 1 var(--font-title);
		font-variant-numeric: tabular-nums;
		color: var(--metal);
		background: #050d1ae8;
		border: 1px solid color-mix(in srgb, var(--metal) 72%, transparent);
		clip-path: polygon(10% 0, 100% 0, 100% 100%, 10% 100%, 0 50%);
	}
	.landscape .serial-engraving {
		right: 4%;
		bottom: 5.8%;
		font-size: 3.7cqw;
		padding: 1% 1.6%;
	}
	.image-fallback {
		position: absolute;
		z-index: 1;
		inset: 12% 8% 28%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 5%;
		color: #9fb0c4;
		font-size: 5cqw;
		text-align: center;
	}
	.image-fallback > span {
		font-size: 20cqw;
		color: var(--metal);
	}
	.engraving {
		position: absolute;
		z-index: 3;
		inset: 0;
		pointer-events: none;
	}
	[data-theme='chrome'] .card-shell {
		background: linear-gradient(145deg, #15263a, #070d18 56%, #21354b);
	}
	[data-theme='chrome'] .engraving {
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
	[data-theme='nebula'] .engraving {
		background:
			radial-gradient(#e9deff 0 1px, transparent 1.3px) 0 0 / 41px 53px,
			radial-gradient(ellipse at 20% 65%, #7644ad44, transparent 42%);
		mask-image: linear-gradient(90deg, #000, transparent 37%, transparent 65%, #000);
	}
	[data-theme='nebula'] .card-shell {
		clip-path: polygon(12% 0, 88% 0, 100% 12%, 96% 82%, 86% 100%, 7% 96%, 0 76%, 4% 13%);
		background:
			radial-gradient(ellipse at 22% 68%, #633c944f, transparent 45%),
			linear-gradient(145deg, #171636, #050916 66%);
	}
	[data-theme='nebula'] .inner-rail {
		inset: 4.5% 5.5% 5.5% 4%;
		border-radius: 48% 10% 42% 13%;
		transform: rotate(-1.5deg);
	}
	[data-theme='nebula'] .name-cartouche {
		left: 11%;
		border-radius: 50% 8% 42% 10%;
		background: linear-gradient(90deg, #1f1744f2, #090e25e8);
	}
	[data-theme='arcade'] .inner-rail {
		clip-path: polygon(
			0 0,
			38% 0,
			38% 2%,
			98% 2%,
			98% 38%,
			100% 38%,
			100% 100%,
			62% 100%,
			62% 98%,
			2% 98%,
			2% 62%,
			0 62%
		);
		border: 2px solid var(--metal);
	}
	[data-theme='arcade'] .card-shell {
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
		background:
			repeating-linear-gradient(0deg, transparent 0 7px, #82ffc90b 7px 8px),
			linear-gradient(145deg, #0e3a36, #050c19 62%);
	}
	[data-theme='arcade'] .name-cartouche {
		clip-path: polygon(
			0 0,
			84% 0,
			84% 10%,
			96% 10%,
			96% 30%,
			100% 30%,
			100% 100%,
			10% 100%,
			10% 90%,
			0 90%
		);
		background: #071b23f0;
		box-shadow: inset 5px 0 0 var(--metal);
	}
	[data-theme='arcade'] .engraving {
		background: repeating-linear-gradient(
			0deg,
			transparent 0 14px,
			color-mix(in srgb, var(--metal) 8%, transparent) 14px 15px
		);
	}
	[data-theme='neon'] .inner-rail {
		border-color: #f165b9;
		box-shadow:
			inset 0 0 12px #f165b938,
			0 0 9px #6de7ef38;
	}
	[data-theme='neon'] .card-shell {
		background: linear-gradient(145deg, #24102c, #050a17 52%, #082b36);
		clip-path: polygon(9% 0, 100% 0, 94% 13%, 100% 87%, 91% 100%, 0 100%, 6% 86%, 0 12%);
	}
	[data-theme='neon'] .inner-rail {
		inset: 3.5% 6% 5% 4%;
		clip-path: polygon(8% 0, 100% 0, 94% 12%, 100% 87%, 90% 100%, 0 100%, 6% 86%, 0 11%);
		transform: skewX(-2deg);
	}
	[data-theme='neon'] .name-cartouche {
		right: 4%;
		left: 12%;
		background: linear-gradient(90deg, #380d32f2, #062b35ed);
		border-color: #f165b9;
		clip-path: polygon(8% 0, 100% 0, 94% 100%, 0 100%);
		box-shadow: -5px 0 0 #65e8ef;
	}
	[data-theme='comics'] .engraving {
		background: radial-gradient(#ff8c741f 1.1px, transparent 1.3px) 0 0 / 5px 5px;
		mask-image: linear-gradient(90deg, #000, transparent 38%, transparent 62%, #000);
	}
	[data-theme='comics'] .card-shell {
		clip-path: polygon(
			7% 0,
			91% 3%,
			100% 10%,
			97% 31%,
			100% 52%,
			96% 72%,
			100% 94%,
			89% 100%,
			66% 97%,
			45% 100%,
			22% 97%,
			3% 100%,
			0 87%,
			3% 65%,
			0 45%,
			4% 21%,
			0 7%
		);
		background:
			radial-gradient(#ff8c7424 1px, transparent 1.4px) 0 0 / 6px 6px,
			linear-gradient(145deg, #55271f, #0b0b17 66%);
	}
	[data-theme='comics'] .inner-rail {
		inset: 4%;
		border: 3px solid #191624;
		box-shadow: 3px 3px 0 var(--metal);
		transform: rotate(0.7deg);
	}
	[data-theme='comics'] .name-cartouche {
		right: 5%;
		left: 5%;
		color: #151b2c;
		background: #fff0cf;
		border: 3px solid #191624;
		clip-path: polygon(0 8%, 4% 0, 94% 3%, 100% 24%, 96% 100%, 3% 96%);
		box-shadow: 4px 4px 0 var(--metal);
		text-shadow: none;
	}
	[data-theme='comics'] .name-cartouche span {
		text-shadow: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.variant-card {
			transition: none;
		}
		.variant-card:hover,
		.variant-card.effects-active {
			transform: none;
		}
	}
</style>
