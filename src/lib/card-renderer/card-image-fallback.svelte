<script lang="ts">
	import Brand from '$lib/brand/brand.svelte';
	let { label }: { label: string } = $props();
</script>

<div class="fallback" role="img" aria-label={label} data-testid="card-image-fallback">
	<div class="symbol"><Brand kind="symbol" /></div>
	<div class="wordmark"><Brand kind="wordmark" /></div>
</div>

<style>
	.fallback {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 5cqw;
		background: #171918;
		color: #efebd9;
		pointer-events: none;
	}
	.fallback::before {
		content: '';
		position: absolute;
		inset: 6%;
		border: 1px solid #efebd92e;
	}
	.fallback::after {
		content: '';
		position: absolute;
		bottom: 6%;
		left: 6%;
		width: 16%;
		height: 3cqw;
		background: #e8ef42;
		clip-path: polygon(0 0, 100% 0, 82% 100%, 0 100%);
	}
	.symbol {
		width: 28%;
		aspect-ratio: 192 / 272;
		max-height: 52%;
	}
	.wordmark {
		font-size: 8cqw;
		line-height: 1;
	}
</style>
