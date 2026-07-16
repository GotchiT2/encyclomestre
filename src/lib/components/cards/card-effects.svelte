<script lang="ts">
	import type { CardRarityInitials } from '$lib/types';

	let {
		rarity,
		active = false
	}: {
		rarity: CardRarityInitials;
		active?: boolean;
	} = $props();

	const hasEffect = $derived(rarity === 'PC' || rarity === 'R');
</script>

{#if hasEffect}
	<span
		class="card-illustration-effect"
		data-testid="card-effects"
		data-rarity={rarity}
		data-active={active}
		aria-hidden="true"
	></span>
{/if}

<style>
	.card-illustration-effect {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		background:
			radial-gradient(
				circle at calc(var(--card-pointer-x, 50) * 1%) calc(var(--card-pointer-y, 50) * 1%),
				rgb(255 255 255 / 18%),
				transparent 34%
			),
			linear-gradient(
				115deg,
				transparent 26%,
				rgb(255 255 255 / 5%) 40%,
				rgb(255 255 255 / 20%) 50%,
				rgb(255 255 255 / 6%) 60%,
				transparent 74%
			);
		mix-blend-mode: screen;
		opacity: 0;
		transition: opacity 180ms ease;
	}

	.card-illustration-effect[data-active='true'][data-rarity='PC'] {
		opacity: 0.42;
	}

	.card-illustration-effect[data-active='true'][data-rarity='R'] {
		opacity: 0.62;
	}

	@media (prefers-reduced-motion: reduce) {
		.card-illustration-effect {
			background: rgb(255 255 255 / 6%);
			mix-blend-mode: screen;
			transition: none;
		}

		.card-illustration-effect[data-active='true'][data-rarity='PC'] {
			opacity: 0.5;
		}

		.card-illustration-effect[data-active='true'][data-rarity='R'] {
			opacity: 0.72;
		}
	}
</style>
