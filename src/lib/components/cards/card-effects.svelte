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
	const hasAmbientAnimation = $derived(rarity === 'L');
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
		<span class="card-effects__varnish"></span>
		<span class="card-effects__sparkles"></span>
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
		--varnish-rest: 0;
		--varnish-active: 0;
		--sparkles-rest: 0;
		--sparkles-active: 0;
	}

	.card-effects > span {
		transition:
			opacity 180ms ease,
			filter 240ms ease;
	}

	.card-effects__glare {
		background:
			radial-gradient(
				ellipse 115% 85% at calc(var(--card-pointer-x, 50) * 1%)
					calc(var(--card-pointer-y, 50) * 1%),
				rgb(255 255 255 / 44%) 0,
				rgb(255 255 255 / 22%) 34%,
				rgb(255 255 255 / 6%) 60%,
				transparent 82%
			),
			radial-gradient(
				ellipse 140% 110% at calc(100% - var(--card-pointer-x, 50) * 1%)
					calc(100% - var(--card-pointer-y, 50) * 1%),
				rgb(255 255 255 / 16%),
				transparent 76%
			);
		mix-blend-mode: screen;
		opacity: var(--glare-rest);
	}

	.card-effects__varnish {
		background:
			radial-gradient(
				ellipse 105% 95% at calc(var(--card-pointer-x, 50) * 1% - 22%)
					calc(var(--card-pointer-y, 50) * 1% + 12%),
				rgb(142 214 210 / 48%),
				rgb(194 232 229 / 18%) 48%,
				transparent 82%
			),
			radial-gradient(
				ellipse 98% 90% at calc(100% - var(--card-pointer-x, 50) * 1% + 22%)
					calc(100% - var(--card-pointer-y, 50) * 1% - 12%),
				rgb(245 218 144 / 44%),
				rgb(255 246 211 / 16%) 50%,
				transparent 84%
			),
			radial-gradient(
				ellipse 145% 105% at calc(var(--card-pointer-x, 50) * 1%)
					calc(var(--card-pointer-y, 50) * 1%),
				rgb(255 255 255 / 30%),
				rgb(255 255 255 / 10%) 54%,
				transparent 86%
			);
		filter: saturate(0.74) contrast(1.01);
		mix-blend-mode: screen;
		opacity: var(--varnish-rest);
	}

	.card-effects__sparkles {
		background-image:
			radial-gradient(circle at 12% 19%, rgb(255 255 255 / 92%) 0 0.8px, transparent 1.9px),
			radial-gradient(circle at 69% 14%, rgb(245 218 144 / 88%) 0 1px, transparent 2.1px),
			radial-gradient(circle at 37% 61%, rgb(173 229 225 / 90%) 0 1.1px, transparent 2.2px),
			radial-gradient(circle at 84% 73%, rgb(255 255 255 / 82%) 0 0.8px, transparent 1.9px),
			radial-gradient(circle at 21% 84%, rgb(245 218 144 / 76%) 0 0.9px, transparent 2px),
			radial-gradient(circle at 57% 39%, rgb(255 255 255 / 78%) 0 0.7px, transparent 1.8px),
			radial-gradient(circle at 92% 42%, rgb(166 222 218 / 80%) 0 0.9px, transparent 2px);
		background-size:
			47% 41%,
			63% 52%,
			71% 66%,
			53% 61%,
			58% 49%,
			67% 57%,
			49% 68%;
		filter: brightness(0.88);
		mix-blend-mode: screen;
		opacity: var(--sparkles-rest);
	}

	.card-effects[data-active='true'] .card-effects__glare {
		opacity: var(--glare-active);
	}

	.card-effects[data-active='true'] .card-effects__varnish {
		opacity: var(--varnish-active);
	}

	.card-effects[data-active='true'] .card-effects__sparkles {
		opacity: var(--sparkles-active);
	}

	.card-effects[data-profile='pc'] {
		--glare-active: 0.2;
	}

	.card-effects[data-profile='r'] {
		--glare-active: 0.22;
		--varnish-active: 0.1;
	}

	.card-effects[data-profile='sr'] {
		--glare-active: 0.18;
		--varnish-active: 0.26;
	}

	.card-effects[data-profile='ur'] {
		--glare-active: 0.2;
		--varnish-active: 0.34;
		--sparkles-active: 0.14;
	}

	.card-effects[data-profile='l'] {
		--glare-active: 0.22;
		--varnish-active: 0.4;
		--sparkles-rest: 0.04;
		--sparkles-active: 0.24;
	}

	.card-effects[data-profile='full-art'] {
		--glare-active: 0.17;
		--varnish-active: 0.32;
		--sparkles-rest: 0.035;
		--sparkles-active: 0.2;
	}

	.card-effects[data-profile='full-art'] .card-effects__glare {
		background:
			radial-gradient(
				ellipse 130% 96% at calc(var(--card-pointer-x, 50) * 1%)
					calc(var(--card-pointer-y, 50) * 1%),
				rgb(255 255 255 / 38%),
				rgb(255 255 255 / 16%) 42%,
				transparent 84%
			),
			radial-gradient(
				ellipse 160% 124% at calc(100% - var(--card-pointer-x, 50) * 1%)
					calc(100% - var(--card-pointer-y, 50) * 1%),
				rgb(255 255 255 / 14%),
				transparent 82%
			);
	}

	.card-effects[data-ambient='true'] .card-effects__sparkles {
		animation: wikiforge-sparkle-breathe 6.8s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.card-effects > span {
			animation: none !important;
			transition: none;
		}
	}

	@keyframes wikiforge-sparkle-breathe {
		0%,
		100% {
			filter: brightness(0.72);
		}
		50% {
			filter: brightness(1.08);
		}
	}
</style>
