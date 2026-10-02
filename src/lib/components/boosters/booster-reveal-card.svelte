<script lang="ts">
	import VariantCardFace from '$lib/components/cards/variant-card-face.svelte';
	import { _ } from '$lib/i18n';
	import type { CardRecord } from '$lib/types';
	let {
		card,
		revealed,
		interactive = true,
		detailsEnabled = true,
		class: className = '',
		onReveal,
		onOpenDetail,
		onOrientationChange = () => undefined
	}: {
		card: CardRecord;
		revealed: boolean;
		interactive?: boolean;
		detailsEnabled?: boolean;
		class?: string;
		onReveal: () => void;
		onOpenDetail: () => void;
		onOrientationChange?: (landscape: boolean) => void;
	} = $props();
	let landscape = $state(false);
</script>

<div
	class={'booster-reveal-card ' + className}
	class:is-revealed={revealed}
	class:is-landscape={revealed && landscape}
	data-revealed={revealed}
	data-front-orientation={landscape ? 'landscape' : 'portrait'}
	style={`--variant-color:${card.variant.color}`}
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
		<span class="booster-card-flipper">
			<span class="booster-card-front" aria-hidden={!revealed}
				><VariantCardFace
					{card}
					onOrientationChange={(value) => {
						landscape = value;
						onOrientationChange(value);
					}}
				/></span
			>
			<span class="booster-card-reverse" aria-hidden={revealed}
				><span class="reverse-mark">✦</span><span>{$_('navigation.brand')}</span></span
			>
		</span>
	</button>
	<span class="sr-only" aria-live="polite">{revealed ? card.title : ''}</span>
</div>

<style>
	.booster-reveal-card {
		width: 100%;
		aspect-ratio: 1/1.416;
		perspective: 1000px;
		min-width: 0;
	}
	.booster-reveal-card.is-landscape {
		aspect-ratio: 1.416/1;
	}
	.booster-card-button {
		position: relative;
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
	}
	.booster-card-flipper {
		position: absolute;
		inset: 0;
		transform-style: preserve-3d;
		transform: rotateY(180deg);
		transition: transform 360ms cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.is-revealed .booster-card-flipper {
		transform: rotateY(0);
	}
	.booster-card-front,
	.booster-card-reverse {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
	}
	.booster-card-front {
		display: grid;
		align-items: center;
	}
	.booster-card-reverse {
		transform: rotateY(180deg);
		border: 2px solid var(--variant-color);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		background: repeating-linear-gradient(135deg, #171918 0 12px, #242923 12px 13px);
		color: #efebd9;
		clip-path: polygon(4% 0, 96% 0, 100% 4%, 100% 96%, 96% 100%, 4% 100%, 0 96%, 0 4%);
		font:
			800 1.4rem 'Barlow Condensed',
			sans-serif;
		text-transform: uppercase;
	}
	.reverse-mark {
		font-size: 4rem;
		color: var(--variant-color);
	}
	.booster-card-button:focus-visible {
		outline: 3px solid #e8ef42;
		outline-offset: 4px;
	}
	@media (prefers-reduced-motion: reduce) {
		.booster-card-flipper {
			transition: none;
		}
	}
</style>
