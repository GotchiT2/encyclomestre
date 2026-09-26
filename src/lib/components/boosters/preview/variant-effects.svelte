<script lang="ts">
	let { profile, fullArt, active }: { profile: string; fullArt: boolean; active: boolean } =
		$props();
</script>

<span
	class="finish-effects"
	data-testid="variant-effects"
	data-profile={profile}
	data-full-art={fullArt}
	data-active={active}
	aria-hidden="true"
>
	<span class="effect-material"></span>
	<span class="effect-glare"></span>
	<span class="effect-signature"></span>
</span>

<style>
	.finish-effects,
	.finish-effects > span {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.finish-effects {
		z-index: 6;
		overflow: hidden;
		border-radius: inherit;
		mix-blend-mode: screen;
	}
	.finish-effects > span {
		opacity: 0;
		transition: opacity 180ms ease-out;
	}
	.effect-glare {
		background: radial-gradient(
			circle at calc(var(--pointer-x, 50) * 1%) calc(var(--pointer-y, 50) * 1%),
			rgb(255 255 255 / 48%),
			rgb(255 255 255 / 13%) 27%,
			transparent 58%
		);
	}
	.finish-effects[data-active='true'] .effect-glare {
		opacity: 0.62;
	}
	.finish-effects[data-full-art='true'] .effect-material {
		opacity: 0.1;
		background: linear-gradient(
			115deg,
			transparent 22%,
			rgb(255 244 201 / 40%) 38%,
			transparent 52%
		);
		background-size: 230% 100%;
		animation: finish-sheen 7s ease-in-out infinite;
	}
	.finish-effects[data-full-art='true'][data-active='true'] .effect-material {
		opacity: 0.25;
	}
	.finish-effects[data-profile='chrome'] .effect-material {
		opacity: 0.16;
		background:
			linear-gradient(
				118deg,
				transparent 10%,
				#75eaff4d 28%,
				#f0a2ff52 43%,
				#ffe5854d 58%,
				transparent 76%
			),
			repeating-linear-gradient(
				105deg,
				transparent 0 18%,
				rgb(255 255 255 / 12%) 19% 20%,
				transparent 21% 38%
			);
		background-size:
			210% 100%,
			170% 100%;
		animation: chrome-shift 6.5s ease-in-out infinite;
	}
	.finish-effects[data-profile='chrome'][data-active='true'] .effect-material {
		opacity: 0.44;
	}
	.finish-effects[data-profile='nebula'] .effect-signature {
		opacity: 0.32;
		background:
			radial-gradient(circle at 14% 22%, #fff 0 1px, transparent 1.8px),
			radial-gradient(circle at 78% 16%, #d8c7ff 0 1px, transparent 1.8px),
			radial-gradient(circle at 66% 72%, #fff 0 1.2px, transparent 2px),
			radial-gradient(ellipse at 50% 52%, transparent 38%, #b998ff38 39% 40%, transparent 41%);
		animation: nebula-drift 8s ease-in-out infinite;
	}
	.finish-effects[data-profile='arcade'] .effect-signature {
		opacity: 0.18;
		background: repeating-linear-gradient(0deg, transparent 0 5px, #7bffbe42 6px, transparent 7px);
		background-size: 100% 160%;
		animation: arcade-scan 4.8s linear infinite;
	}
	.finish-effects[data-profile='neon'] .effect-signature {
		opacity: 0.22;
		background:
			radial-gradient(circle at 15% 80%, #ff4cb36b, transparent 42%),
			radial-gradient(circle at 90% 15%, #5eeeff66, transparent 40%);
		animation: neon-pulse 4.6s ease-in-out infinite;
	}
	.finish-effects[data-profile='comics'] .effect-signature {
		opacity: 0.16;
		background: radial-gradient(circle, #ffcf9c 0 1px, transparent 1.2px) 0 0 / 6px 6px;
		animation: comics-register 5.4s steps(2, end) infinite;
	}
	.finish-effects[data-active='true'] .effect-signature {
		opacity: 0.48;
	}
	@keyframes finish-sheen {
		0%,
		30% {
			background-position: 150% 0;
		}
		70%,
		100% {
			background-position: -80% 0;
		}
	}
	@keyframes chrome-shift {
		0%,
		100% {
			background-position:
				140% 0,
				0 0;
		}
		50% {
			background-position:
				-70% 0,
				100% 0;
		}
	}
	@keyframes nebula-drift {
		50% {
			transform: translate3d(1.5%, -1%, 0) scale(1.03);
		}
	}
	@keyframes arcade-scan {
		to {
			background-position: 0 160%;
		}
	}
	@keyframes neon-pulse {
		50% {
			filter: brightness(1.45) saturate(1.25);
		}
	}
	@keyframes comics-register {
		50% {
			transform: translate(1px, -1px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.finish-effects > span {
			animation: none !important;
			transition: none;
		}
	}
</style>
