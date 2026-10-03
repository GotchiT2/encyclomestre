<script lang="ts">
	import VariantCardFace from '$lib/components/cards/variant-card-face.svelte';
	import BoosterCardBack from './booster-card-back.svelte';
	import { _ } from '$lib/i18n';
	import { arcadePreferences } from '$lib/arcade/preferences';
	import { cardHasStyle, type CardRecord } from '$lib/types';
	import type { BoosterVisual } from './booster-visuals';
	let {
		card,
		revealed,
		visual = 'signal',
		interactive = true,
		detailsEnabled = true,
		massReveal = false,
		class: className = '',
		onReveal,
		onOpenDetail,
		onOrientationChange = () => undefined
	}: {
		card: CardRecord;
		revealed: boolean;
		visual?: BoosterVisual;
		interactive?: boolean;
		detailsEnabled?: boolean;
		massReveal?: boolean;
		class?: string;
		onReveal: () => void;
		onOpenDetail: () => void;
		onOrientationChange?: (landscape: boolean) => void;
	} = $props();
	let landscape = $state(false);
	const fullArt = $derived(cardHasStyle(card, 'FULL_ART'));
	const chrome = $derived(cardHasStyle(card, 'CHROME'));
	const color = $derived(
		/^#[\da-f]{3,8}$/i.test(card.variant.color) ? card.variant.color : '#EFEBD9'
	);
</script>

<div
	class={'booster-reveal-card ' + className}
	class:is-revealed={revealed}
	class:full-art={fullArt}
	class:chrome
	class:quiet={massReveal || $arcadePreferences.motion === 'reduce'}
	data-revealed={revealed}
	data-card-id={card.id}
	data-front-orientation={landscape ? 'landscape' : 'portrait'}
	style={`--variant-color:${color};--flip-duration:${fullArt || chrome ? 600 : 360}ms`}
>
	<button
		class="booster-card-button"
		type="button"
		disabled={revealed ? !detailsEnabled : !interactive}
		onclick={() => (revealed ? onOpenDetail() : onReveal())}
		aria-label={revealed
			? $_('boosters.open_card_detail', { values: { title: card.title } })
			: $_('boosters.reveal_card', { values: { variant: card.variant.name } })}
	>
		<span class="booster-card-flipper"
			><span class="booster-card-front" aria-hidden={!revealed}
				><VariantCardFace
					{card}
					reveal={revealed}
					onOrientationChange={(value) => {
						landscape = value;
						onOrientationChange(value);
					}}
				/></span
			><span class="booster-card-reverse" aria-hidden={revealed}
				><BoosterCardBack {visual} /><span class="finish-cue" aria-hidden="true"></span></span
			></span
		>
		<span class="reveal-sparks" aria-hidden="true"></span>
	</button>
	<span class="card-caption">{revealed ? card.title : ''}</span>
	<span class="sr-only" aria-live="polite">{revealed ? card.title : ''}</span>
</div>

<style>
	.booster-reveal-card {
		width: 100%;
		max-width: 144px;
		min-width: 0;
		perspective: 900px;
	}
	.booster-card-button {
		position: relative;
		width: 100%;
		aspect-ratio: 512/736;
		display: block;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
	}
	.booster-card-flipper {
		position: absolute;
		inset: 0;
		transform-style: preserve-3d;
		transform: rotateY(180deg);
		transition: transform var(--flip-duration) cubic-bezier(0.18, 0.75, 0.2, 1);
	}
	.is-revealed .booster-card-flipper {
		transform: rotateY(0);
	}
	.booster-card-front,
	.booster-card-reverse {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		border-radius: 5px;
	}
	.booster-card-front {
		display: grid;
		align-content: center;
	}
	.booster-card-front :global(.variant) {
		display: none;
	}
	.booster-card-reverse {
		transform: rotateY(180deg);
	}
	.finish-cue {
		position: absolute;
		inset: 0;
		border: 2px solid var(--variant-color);
		border-radius: 5px;
		box-shadow: 0 0 12px color-mix(in srgb, var(--variant-color) 35%, transparent);
	}
	.full-art .finish-cue {
		border-width: 4px;
		box-shadow:
			0 0 16px color-mix(in srgb, var(--variant-color) 45%, transparent),
			inset 0 0 12px #efebd920;
	}
	.chrome .finish-cue::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 3px;
		background: linear-gradient(125deg, transparent 25%, #efebd944 45%, transparent 58%);
	}
	.card-caption {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		min-height: 32px;
		margin-top: 8px;
		font-size: 12px;
		line-height: 16px;
		text-align: center;
		color: #efebd9a6;
		overflow-wrap: anywhere;
	}
	.booster-card-button:focus-visible {
		outline: 2px solid #e8ef42;
		outline-offset: 5px;
	}
	.is-revealed .booster-card-button {
		animation: card-arrival var(--flip-duration) ease-out;
	}
	.reveal-sparks {
		position: absolute;
		inset: -12px;
		border: 1px solid var(--variant-color);
		border-radius: 7px;
		opacity: 0;
		pointer-events: none;
	}
	.is-revealed.full-art .reveal-sparks,
	.is-revealed.chrome .reveal-sparks {
		animation: finish-arrival 600ms ease-out;
	}
	.quiet .booster-card-button,
	.quiet .reveal-sparks {
		animation: none;
	}
	.quiet .booster-card-flipper {
		transition-duration: 100ms;
		transform: none;
	}
	.quiet .booster-card-front {
		opacity: 0;
	}
	.quiet.is-revealed .booster-card-front {
		opacity: 1;
	}
	.quiet .booster-card-reverse {
		transform: none;
	}
	.quiet.is-revealed .booster-card-reverse {
		display: none;
	}
	@keyframes card-arrival {
		0% {
			transform: translateY(-6px) scale(1.035);
		}
		100% {
			transform: none;
		}
	}
	@keyframes finish-arrival {
		20% {
			opacity: 0.6;
			transform: scale(0.97);
		}
		100% {
			opacity: 0;
			transform: scale(1.14);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.booster-card-button,
		.reveal-sparks {
			animation: none !important;
		}
		.booster-card-flipper {
			transition: none;
			transform: none;
		}
		.booster-card-front {
			opacity: 0;
		}
		.is-revealed .booster-card-front {
			opacity: 1;
		}
		.booster-card-reverse {
			transform: none;
		}
		.is-revealed .booster-card-reverse {
			display: none;
		}
	}
</style>
