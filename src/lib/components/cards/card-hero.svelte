<script lang="ts">
	import { _ } from '$lib/i18n';
	import CardEffects from './card-effects.svelte';
	import { nsfwFilterSettings, shouldBlurCardIllustration } from '$lib/content/nsfw-filter';
	import type { CardRecord } from '$lib/types';
	let { card }: { card: CardRecord } = $props();
	const hasTilt = $derived(['PC', 'R', 'SR', 'UR', 'L'].includes(card.rarityInitials));
	const hasIllustrationEffect = $derived(card.rarityInitials !== 'C');
	const illustrationBlurred = $derived(shouldBlurCardIllustration(card, $nsfwFilterSettings));
	let pointerX = $state(50);
	let pointerY = $state(50);
	let activeInteraction = $state(false);

	function updateInteraction(event: PointerEvent) {
		if (!hasTilt && !hasIllustrationEffect) return;
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

	const effectStyle = $derived(
		`--card-pointer-x:${pointerX.toFixed(2)};--card-pointer-y:${pointerY.toFixed(2)};--card-rotate-x:${((pointerY - 50) * -0.06).toFixed(2)}deg;--card-rotate-y:${((pointerX - 50) * 0.06).toFixed(2)}deg`
	);
</script>

<section
	class="card-hero-host border border-primary/30 bg-black p-4"
	data-tilt-active={hasTilt && activeInteraction}
	data-effect-active={hasIllustrationEffect && activeInteraction}
	role="group"
	aria-label={card.title}
	style={effectStyle}
	onpointermove={updateInteraction}
	onpointerdown={(event) => {
		if (event.pointerType !== 'mouse' && (hasTilt || hasIllustrationEffect)) {
			activeInteraction = true;
		}
	}}
	onpointerleave={resetInteraction}
	onpointerup={resetInteraction}
	onpointercancel={resetInteraction}
	onfocusin={() => {
		if (hasTilt || hasIllustrationEffect) activeInteraction = true;
	}}
	onfocusout={resetInteraction}
>
	<div class="card-hero-art relative overflow-hidden border border-primary/20 bg-background p-2">
		<div class="relative overflow-hidden" data-testid="card-hero-illustration">
			<img
				src={card.imageUrl}
				alt={card.title}
				class={`aspect-[3/4] w-full object-cover ${illustrationBlurred ? 'blur-xl' : ''}`}
			/>
			{#if illustrationBlurred}
				<span
					class="absolute inset-0 grid place-items-center bg-background/55 font-mono text-[10px] uppercase tracking-widest text-primary"
					aria-label={$_('cardState.nsfw_blurred')}
					data-testid="card-hero-nsfw-blur"
				></span>
			{/if}
			<CardEffects
				rarity={card.rarityInitials}
				fullArt={Boolean(card.isFullArt)}
				active={activeInteraction}
			/>
		</div>
	</div>
	<p
		class="mt-3 font-mono text-[10px] uppercase tracking-widest"
		style={`color:${card.rarityColor}`}
	>
		{card.rarity} · {card.rarityInitials}
	</p>
	<p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">
		{$_('cardDetail.owned_count', { values: { count: card.ownedCount } })}
	</p>
</section>

<style>
	.card-hero-host {
		perspective: 1000px;
	}

	.card-hero-art {
		transform: rotateX(0deg) rotateY(0deg);
		transform-style: preserve-3d;
		transition: transform 240ms ease-out;
		will-change: transform;
	}

	.card-hero-host[data-tilt-active='true'] .card-hero-art {
		transform: rotateX(var(--card-rotate-x)) rotateY(var(--card-rotate-y));
	}

	@media (prefers-reduced-motion: reduce) {
		.card-hero-art,
		.card-hero-host[data-tilt-active='true'] .card-hero-art {
			transform: none;
			transition: none;
		}
	}
</style>
