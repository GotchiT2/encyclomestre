<script lang="ts">
	let {
		rarityColor,
		isFullArt = false
	}: {
		rarityColor: string;
		isFullArt?: boolean;
	} = $props();
</script>

<div
	class="booster-card-back"
	class:booster-card-back-full-art={isFullArt}
	style={`--rarity-color:${rarityColor}`}
	aria-hidden="true"
>
	<div class="booster-card-back-grid"></div>
	<div class="booster-card-back-seal">
		<span>W</span>
	</div>
	<p>WikiForge</p>
</div>

<style>
	.booster-card-back {
		position: absolute;
		inset: 0;
		overflow: hidden;
		border: 3px double color-mix(in srgb, var(--primary) 75%, white 8%);
		background:
			radial-gradient(
				circle at 50% 45%,
				color-mix(in srgb, var(--rarity-color) 20%, transparent),
				transparent 35%
			),
			linear-gradient(145deg, #102b3e 0%, #07121f 52%, #0d2030 100%);
		box-shadow:
			inset 0 0 0 7px #07101b,
			inset 0 0 0 9px color-mix(in srgb, var(--primary) 52%, transparent),
			inset 0 0 3rem rgb(0 0 0 / 70%);
	}

	.booster-card-back::before,
	.booster-card-back::after {
		content: '';
		position: absolute;
		inset: 8%;
		border: 1px solid color-mix(in srgb, var(--primary) 52%, transparent);
		clip-path: polygon(12% 0, 88% 0, 100% 10%, 100% 90%, 88% 100%, 12% 100%, 0 90%, 0 10%);
	}

	.booster-card-back::after {
		inset: 12%;
		border-color: color-mix(in srgb, var(--rarity-color) 42%, transparent);
		transform: rotate(180deg);
	}

	.booster-card-back-grid {
		position: absolute;
		inset: 15%;
		opacity: 0.22;
		background-image:
			linear-gradient(45deg, transparent 47%, var(--primary) 49% 51%, transparent 53%),
			linear-gradient(-45deg, transparent 47%, var(--primary) 49% 51%, transparent 53%);
		background-size: 2rem 2rem;
	}

	.booster-card-back-seal {
		position: absolute;
		top: 50%;
		left: 50%;
		display: grid;
		width: 43%;
		aspect-ratio: 1;
		place-items: center;
		border: 2px solid color-mix(in srgb, var(--rarity-color) 75%, var(--primary));
		background: radial-gradient(circle, #16354a 0 28%, #08131f 30% 58%, #102b3e 60%);
		box-shadow:
			0 0 1.5rem color-mix(in srgb, var(--rarity-color) 32%, transparent),
			inset 0 0 1rem rgb(0 0 0 / 75%);
		transform: translate(-50%, -55%) rotate(45deg);
	}

	.booster-card-back-seal span {
		font-family: var(--font-serif);
		font-size: clamp(2rem, 5vw, 4rem);
		font-weight: 900;
		color: var(--primary);
		text-shadow: 0 0 0.8rem color-mix(in srgb, var(--rarity-color) 65%, transparent);
		transform: rotate(-45deg);
	}

	p {
		position: absolute;
		right: 0;
		bottom: 10%;
		left: 0;
		font-family: var(--font-serif);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		color: var(--primary);
		text-align: center;
		text-transform: uppercase;
	}

	.booster-card-back-full-art {
		background:
			radial-gradient(circle at 50% 45%, rgb(207 29 29 / 32%), transparent 38%),
			conic-gradient(from 45deg, #07121f, #2f1118, #07121f, #4a2710, #07121f);
	}
</style>
