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
				ellipse 48% 34% at calc(var(--card-pointer-x, 50) * 1%) calc(var(--card-pointer-y, 50) * 1%),
				rgb(255 255 255 / 92%) 0,
				rgb(255 255 255 / 46%) 18%,
				rgb(255 255 255 / 12%) 42%,
				transparent 68%
			),
			radial-gradient(
				ellipse 82% 62% at calc(var(--card-pointer-x, 50) * 1%) calc(var(--card-pointer-y, 50) * 1%),
				rgb(255 255 255 / 26%),
				transparent 72%
			);
		mix-blend-mode: screen;
		opacity: var(--glare-rest);
	}

	.card-effects__varnish {
		background:
			radial-gradient(
				ellipse 58% 74% at calc(var(--card-pointer-x, 50) * 1% - 18%)
					calc(var(--card-pointer-y, 50) * 1% + 10%),
				rgb(142 214 210 / 78%),
				rgb(194 232 229 / 34%) 38%,
				transparent 72%
			),
			radial-gradient(
				ellipse 52% 68% at calc(var(--card-pointer-x, 50) * 1% + 20%)
					calc(var(--card-pointer-y, 50) * 1% - 12%),
				rgb(245 218 144 / 76%),
				rgb(255 246 211 / 26%) 42%,
				transparent 74%
			),
			radial-gradient(
				ellipse 72% 54% at calc(var(--card-pointer-x, 50) * 1%) calc(var(--card-pointer-y, 50) * 1%),
				rgb(255 255 255 / 54%),
				transparent 70%
			);
		filter: saturate(0.82) contrast(1.02);
		mix-blend-mode: soft-light;
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
		--glare-active: 0.24;
	}

	.card-effects[data-profile='r'] {
		--glare-active: 0.28;
		--varnish-active: 0.08;
	}

	.card-effects[data-profile='sr'] {
		--glare-active: 0.26;
		--varnish-active: 0.17;
	}

	.card-effects[data-profile='ur'] {
		--glare-active: 0.28;
		--varnish-active: 0.22;
		--sparkles-active: 0.08;
	}

	.card-effects[data-profile='l'] {
		--glare-active: 0.3;
		--varnish-active: 0.24;
		--sparkles-rest: 0.025;
		--sparkles-active: 0.15;
	}

	.card-effects[data-profile='full-art'] {
		--glare-active: 0.21;
		--varnish-active: 0.18;
		--sparkles-rest: 0.02;
		--sparkles-active: 0.11;
	}

	.card-effects[data-profile='full-art'] .card-effects__glare {
		background:
			radial-gradient(
				ellipse 58% 42% at calc(var(--card-pointer-x, 50) * 1%) calc(var(--card-pointer-y, 50) * 1%),
				rgb(255 255 255 / 84%),
				rgb(255 255 255 / 32%) 24%,
				transparent 72%
			),
			radial-gradient(
				ellipse 92% 74% at calc(var(--card-pointer-x, 50) * 1%) calc(var(--card-pointer-y, 50) * 1%),
				rgb(255 255 255 / 20%),
				transparent 76%
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
