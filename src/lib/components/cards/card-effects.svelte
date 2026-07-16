<script lang="ts">
	import type { CardRarityInitials } from '$lib/types';

	let {
		rarity,
		fullArt = false,
		active = false
	}: {
		rarity: CardRarityInitials;
		fullArt?: boolean;
		active?: boolean;
	} = $props();

	const effectLevelByRarity: Record<CardRarityInitials, number> = {
		C: 0,
		PC: 1,
		R: 2,
		SR: 3,
		UR: 4,
		L: 5
	};
	const hasEffect = $derived(rarity !== 'C');
	const profile = $derived(fullArt && rarity === 'L' ? 'full-art' : rarity.toLowerCase());
	const hasAmbientAnimation = $derived(['SR', 'UR', 'L'].includes(rarity));
	const effectLevel = $derived(fullArt && rarity === 'L' ? 6 : effectLevelByRarity[rarity]);
</script>

{#if hasEffect}
	<span
		class="card-effects"
		data-testid="card-effects"
		data-profile={profile}
		data-rarity={rarity}
		data-effect-level={effectLevel}
		data-active={active}
		data-ambient={hasAmbientAnimation}
		aria-hidden="true"
	>
		<span class="card-effects__glare"></span>
		<span class="card-effects__foil"></span>
		<span class="card-effects__accent"></span>
	</span>
{/if}

<style>
	.card-effects,
	.card-effects > span {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.card-effects {
		z-index: 1;
		overflow: hidden;
		isolation: isolate;
		--glare-rest: 0;
		--glare-active: 0;
		--foil-rest: 0;
		--foil-active: 0;
		--accent-rest: 0;
		--accent-active: 0;
	}

	.card-effects > span {
		transition: opacity 180ms ease;
	}

	.card-effects__glare {
		background:
			radial-gradient(
				circle at calc(var(--card-pointer-x, 50) * 1%) calc(var(--card-pointer-y, 50) * 1%),
				rgb(255 255 255 / 96%) 0,
				rgb(255 255 255 / 48%) 9%,
				transparent 37%
			),
			linear-gradient(
				112deg,
				transparent 29%,
				rgb(255 255 255 / 72%) 47%,
				rgb(255 255 255 / 26%) 55%,
				transparent 72%
			);
		background-position:
			center,
			calc(var(--card-pointer-x, 50) * 1%) center;
		mix-blend-mode: screen;
		opacity: var(--glare-rest);
	}

	.card-effects__foil {
		background:
			repeating-linear-gradient(
				118deg,
				transparent 0 9px,
				rgb(190 235 232 / 72%) 10px,
				transparent 12px 20px
			),
			linear-gradient(
				108deg,
				transparent 18%,
				rgb(255 255 255 / 74%) 37%,
				rgb(126 205 201 / 64%) 49%,
				rgb(245 218 144 / 68%) 61%,
				transparent 82%
			);
		background-position:
			calc(var(--card-pointer-x, 50) * 0.3%) calc(var(--card-pointer-y, 50) * 0.2%),
			calc(var(--card-pointer-x, 50) * 1%) calc(var(--card-pointer-y, 50) * 1%);
		background-size:
			150% 150%,
			210% 210%;
		filter: contrast(1.06);
		mix-blend-mode: soft-light;
		opacity: var(--foil-rest);
	}

	.card-effects__accent {
		background: linear-gradient(
			96deg,
			transparent 27%,
			rgb(245 218 144 / 76%) 47%,
			rgb(178 229 225 / 58%) 55%,
			transparent 73%
		);
		background-position: calc(var(--card-pointer-x, 50) * 1%) center;
		background-size: 190% 100%;
		mix-blend-mode: screen;
		opacity: var(--accent-rest);
	}

	.card-effects[data-active='true'] .card-effects__glare {
		opacity: var(--glare-active);
	}

	.card-effects[data-active='true'] .card-effects__foil {
		opacity: var(--foil-active);
	}

	.card-effects[data-active='true'] .card-effects__accent {
		opacity: var(--accent-active);
	}

	.card-effects[data-profile='pc'] {
		--glare-active: 0.24;
	}

	.card-effects[data-profile='r'] {
		--glare-active: 0.28;
		--foil-active: 0.11;
	}

	.card-effects[data-profile='sr'] {
		--glare-rest: 0.02;
		--glare-active: 0.25;
		--foil-rest: 0.04;
		--foil-active: 0.17;
		--accent-rest: 0.02;
		--accent-active: 0.1;
	}

	.card-effects[data-profile='ur'] {
		--glare-rest: 0.03;
		--glare-active: 0.26;
		--foil-rest: 0.055;
		--foil-active: 0.21;
		--accent-rest: 0.035;
		--accent-active: 0.15;
	}

	.card-effects[data-profile='l'] {
		--glare-rest: 0.04;
		--glare-active: 0.28;
		--foil-rest: 0.065;
		--foil-active: 0.24;
		--accent-rest: 0.055;
		--accent-active: 0.2;
	}

	.card-effects[data-profile='full-art'] {
		--glare-rest: 0.035;
		--glare-active: 0.2;
		--foil-rest: 0.06;
		--foil-active: 0.18;
		--accent-rest: 0.05;
		--accent-active: 0.16;
	}

	.card-effects[data-profile='ur'] .card-effects__accent,
	.card-effects[data-profile='l'] .card-effects__accent,
	.card-effects[data-profile='full-art'] .card-effects__accent {
		background-image:
			linear-gradient(
				98deg,
				transparent 24%,
				rgb(245 218 144 / 82%) 45%,
				rgb(255 255 255 / 66%) 51%,
				rgb(151 218 213 / 62%) 58%,
				transparent 76%
			),
			radial-gradient(
				circle at calc(var(--card-pointer-x, 50) * 1%) calc(var(--card-pointer-y, 50) * 1%),
				rgb(245 218 144 / 72%),
				transparent 31%
			);
		background-size:
			190% 100%,
			100% 100%;
	}

	.card-effects[data-profile='l'] .card-effects__accent,
	.card-effects[data-profile='full-art'] .card-effects__accent {
		background-image:
			radial-gradient(circle at 15% 22%, rgb(255 255 255 / 90%) 0 1px, transparent 2px),
			radial-gradient(circle at 76% 18%, rgb(245 218 144 / 82%) 0 1px, transparent 2px),
			radial-gradient(circle at 42% 68%, rgb(175 229 225 / 86%) 0 1.2px, transparent 2.2px),
			radial-gradient(circle at 88% 72%, rgb(255 255 255 / 76%) 0 1px, transparent 2px),
			linear-gradient(
				98deg,
				transparent 24%,
				rgb(245 218 144 / 76%) 46%,
				rgb(255 255 255 / 62%) 51%,
				rgb(151 218 213 / 56%) 58%,
				transparent 76%
			);
		background-position:
			calc(var(--card-pointer-x, 50) * 0.15%) calc(var(--card-pointer-y, 50) * 0.12%),
			calc(var(--card-pointer-x, 50) * -0.12%) calc(var(--card-pointer-y, 50) * 0.18%),
			center,
			center,
			calc(var(--card-pointer-x, 50) * 1%) center;
		background-size:
			42% 38%,
			56% 48%,
			60% 58%,
			38% 46%,
			190% 100%;
	}

	.card-effects[data-profile='full-art'] .card-effects__foil {
		background-size:
			220% 165%,
			250% 190%;
	}

	.card-effects[data-ambient='true'] .card-effects__foil {
		animation: wikiforge-foil-drift 8s ease-in-out infinite;
	}

	.card-effects[data-profile='l'] .card-effects__accent,
	.card-effects[data-profile='full-art'] .card-effects__accent {
		animation: wikiforge-sparkle-drift 5.6s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.card-effects > span {
			animation: none !important;
			transition: none;
		}

		.card-effects__glare,
		.card-effects__foil,
		.card-effects__accent {
			background-position: center;
		}
	}

	@keyframes wikiforge-foil-drift {
		0%,
		100% {
			background-position:
				18% 24%,
				28% 38%;
		}
		50% {
			background-position:
				78% 72%,
				72% 62%;
		}
	}

	@keyframes wikiforge-sparkle-drift {
		0%,
		100% {
			filter: brightness(0.88);
		}
		50% {
			filter: brightness(1.08);
		}
	}
</style>
