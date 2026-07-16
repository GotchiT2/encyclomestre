<script lang="ts">
	import { _ } from '$lib/i18n';
	import type { CardPricePoint } from '$lib/types';

	let { points }: { points: CardPricePoint[] } = $props();
	const width = 800;
	const height = 260;
	const padding = 28;
	const chartPoints = $derived.by(() => {
		if (!points.length) return [];
		const prices = points.map((point) => point.price);
		const minimum = Math.min(...prices);
		const maximum = Math.max(...prices);
		const range = Math.max(1, maximum - minimum);
		return points.map((point, index) => ({
			x:
				points.length === 1
					? width / 2
					: padding + (index / (points.length - 1)) * (width - padding * 2),
			y: height - padding - ((point.price - minimum) / range) * (height - padding * 2),
			point
		}));
	});
	const line = $derived(chartPoints.map(({ x, y }) => `${x},${y}`).join(' '));
	const area = $derived(
		chartPoints.length
			? `${padding},${height - padding} ${line} ${width - padding},${height - padding}`
			: ''
	);
</script>

<div class="border border-primary/25 bg-background/70 p-2 sm:p-3">
	{#if chartPoints.length}
		<svg
			viewBox={`0 0 ${width} ${height}`}
			class="h-52 w-full overflow-visible sm:h-64"
			preserveAspectRatio="none"
			role="img"
			aria-label={$_('market.price_history')}
		>
			<defs>
				<linearGradient id="card-market-area" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stop-color="var(--primary)" stop-opacity="0.35" />
					<stop offset="1" stop-color="var(--primary)" stop-opacity="0.02" />
				</linearGradient>
			</defs>
			{#each [0.25, 0.5, 0.75] as guide (guide)}
				<line
					x1={padding}
					x2={width - padding}
					y1={height * guide}
					y2={height * guide}
					stroke="var(--primary)"
					stroke-opacity="0.12"
					stroke-dasharray="8 8"
				/>
			{/each}
			<polygon points={area} fill="url(#card-market-area)" />
			<polyline
				points={line}
				fill="none"
				stroke="var(--primary)"
				stroke-width="4"
				vector-effect="non-scaling-stroke"
			/>
			{#each chartPoints as item, index (`${item.point.date}-${index}`)}
				<circle
					cx={item.x}
					cy={item.y}
					r="6"
					fill="var(--background)"
					stroke="var(--primary)"
					stroke-width="3"
					vector-effect="non-scaling-stroke"
				/>
			{/each}
		</svg>
	{:else}
		<p class="grid h-52 place-items-center text-sm text-muted-foreground sm:h-64">
			{$_('market.no_price_history')}
		</p>
	{/if}
</div>
