<script lang="ts">
	const STAR_COUNT = 110;

	/** PRNG déterministe : le serveur et le client génèrent le même ciel (pas de mismatch d'hydratation). */
	function createRandom(seed: number) {
		let state = seed;
		return () => {
			state = (state * 1664525 + 1013904223) % 4294967296;
			return state / 4294967296;
		};
	}

	const random = createRandom(20260829);
	const stars = Array.from({ length: STAR_COUNT }, () => ({
		x: round(random() * 100),
		y: round(random() * 100),
		size: round(1 + random() * 2.4),
		delay: round(random() * -9),
		duration: round(2.4 + random() * 5.6),
		dim: round(0.1 + random() * 0.28),
		bright: round(0.62 + random() * 0.38),
		warm: random() > 0.7
	}));

	function round(value: number) {
		return Math.round(value * 100) / 100;
	}
</script>

<div class="forge-starfield" aria-hidden="true">
	{#each stars as star, index (index)}
		<span
			class="forge-star"
			class:forge-star-warm={star.warm}
			style="--star-x:{star.x}%; --star-y:{star.y}%; --star-size:{star.size}px; --star-delay:{star.delay}s; --star-duration:{star.duration}s; --star-dim:{star.dim}; --star-bright:{star.bright};"
		></span>
	{/each}
</div>
