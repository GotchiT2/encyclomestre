<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import BoosterCardBack from './booster-card-back.svelte';
	import { _ } from '$lib/i18n';
	import { cn } from '$lib/utils';
	import type { CardRecord } from '$lib/types';
	const particles = Array.from({ length: 8 }, (_, index) => index);

	let {
		card,
		revealed,
		interactive = true,
		class: className,
		onReveal
	}: {
		card: CardRecord;
		revealed: boolean;
		interactive?: boolean;
		class?: string;
		onReveal: () => void;
	} = $props();
</script>

<div
	class={cn('booster-reveal-card', className)}
	class:is-revealed={revealed}
	class:is-legendary={card.rarity === 'Légendaire'}
	class:is-full-art={Boolean(card.isFullArt)}
	style={`--rarity-color:${card.rarityColor}`}
	data-rarity={card.rarityInitials}
	data-revealed={revealed}
>
	<div class="booster-rarity-aura" aria-hidden="true"></div>
	{#if card.rarity !== 'Commune'}
		<div class="booster-particles" aria-hidden="true">
			{#each particles as index (index)}<span style={`--particle-index:${index}`}></span>{/each}
		</div>
	{/if}
	<button
		type="button"
		class="booster-card-button"
		disabled={!interactive || revealed}
		onclick={onReveal}
		aria-label={revealed
			? card.title
			: $_('boosters.reveal_card', { values: { rarity: card.rarity } })}
		data-booster-interactive
	>
		<span class="booster-card-flipper">
			<span class="booster-card-face booster-card-front" aria-hidden={!revealed}>
				<CardTile {card} showFriendOwners={false} />
			</span>
			<span class="booster-card-face booster-card-reverse">
				<BoosterCardBack rarityColor={card.rarityColor} isFullArt={card.isFullArt} />
			</span>
		</span>
	</button>
	<span class="sr-only" aria-live="polite">{revealed ? card.title : ''}</span>
</div>

<style>
	.booster-reveal-card {
		position: relative;
		width: 13rem;
		aspect-ratio: 862 / 1221;
		perspective: 1200px;
		isolation: isolate;
	}

	.booster-rarity-aura {
		position: absolute;
		inset: -10%;
		z-index: -2;
		background: radial-gradient(
			ellipse,
			color-mix(in srgb, var(--rarity-color) 68%, transparent),
			transparent 67%
		);
		filter: blur(16px);
		opacity: 0.64;
		animation: booster-aura 2.2s ease-in-out infinite;
	}

	.booster-reveal-card[data-rarity='SR'] .booster-rarity-aura,
	.booster-reveal-card[data-rarity='UR'] .booster-rarity-aura {
		opacity: 0.82;
	}

	.booster-reveal-card[data-rarity='L'] .booster-rarity-aura {
		inset: -17%;
		opacity: 1;
		filter: blur(22px);
	}

	.booster-card-button,
	.booster-card-flipper,
	.booster-card-face {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}

	.booster-card-button {
		cursor: pointer;
		border: 0;
		background: transparent;
		outline: none;
	}

	.booster-card-button:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 8px;
	}

	.booster-card-button:disabled {
		cursor: default;
	}

	.booster-card-flipper {
		transform-style: preserve-3d;
		transition: transform 620ms cubic-bezier(0.2, 0.75, 0.2, 1.12);
	}

	.is-revealed .booster-card-flipper {
		transform: rotateY(180deg);
	}

	.booster-card-face {
		backface-visibility: hidden;
	}

	.booster-card-front {
		transform: rotateY(180deg);
	}

	.booster-card-front :global(.wikiforge-card-size) {
		width: 100%;
	}

	.booster-card-reverse {
		filter: drop-shadow(0 16px 18px rgb(0 0 0 / 55%));
	}

	.is-revealed .booster-rarity-aura {
		animation: booster-reveal-flash 850ms ease-out both;
	}

	.booster-particles span {
		position: absolute;
		top: 50%;
		left: 50%;
		z-index: -1;
		width: 5px;
		aspect-ratio: 1;
		background: var(--rarity-color);
		box-shadow: 0 0 10px var(--rarity-color);
		opacity: 0;
	}

	.is-revealed .booster-particles span {
		animation: booster-particle-burst 900ms ease-out both;
		animation-delay: calc(var(--particle-index) * 28ms);
	}

	.is-full-art.is-revealed::after {
		content: '';
		position: absolute;
		inset: -7%;
		z-index: -1;
		border: 2px solid color-mix(in srgb, #f8c943 70%, transparent);
		box-shadow: 0 0 2rem rgb(207 29 29 / 78%);
		animation: booster-full-art-signature 1.1s ease-out both;
	}

	@media (min-width: 1280px) {
		.booster-reveal-card {
			width: 17rem;
		}
	}

	@keyframes booster-aura {
		50% {
			transform: scale(1.08);
			opacity: 0.92;
		}
	}

	@keyframes booster-reveal-flash {
		0% {
			transform: scale(0.72);
			opacity: 0.75;
		}
		35% {
			transform: scale(1.2);
			opacity: 1;
		}
		100% {
			transform: scale(1);
			opacity: 0.42;
		}
	}

	@keyframes booster-particle-burst {
		0% {
			transform: rotate(calc(var(--particle-index) * 45deg)) translateY(0);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		100% {
			transform: rotate(calc(var(--particle-index) * 45deg)) translateY(-10rem);
			opacity: 0;
		}
	}

	@keyframes booster-full-art-signature {
		0% {
			transform: scale(0.7) rotate(6deg);
			opacity: 0;
		}
		45% {
			opacity: 1;
		}
		100% {
			transform: scale(1.08) rotate(0);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.booster-card-flipper {
			transition: none;
		}
		.booster-rarity-aura,
		.is-revealed .booster-rarity-aura,
		.is-revealed .booster-particles span,
		.is-full-art.is-revealed::after {
			animation: none;
		}
		.booster-particles {
			display: none;
		}
	}
</style>
