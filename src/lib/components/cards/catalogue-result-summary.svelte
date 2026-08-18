<script lang="ts">
	import { cardRarityOptions, type CardRarityCode } from '$lib/domain/cards/rarities';
	import { _ } from '$lib/i18n';

	let {
		total,
		rarityResults
	}: {
		total: number;
		rarityResults: Record<CardRarityCode, number>;
	} = $props();

	const formatCount = new Intl.NumberFormat('fr-FR').format;
</script>

<section
	class="flex flex-col gap-3 border-y border-primary/20 bg-background/35 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
	aria-live="polite"
	data-testid="catalogue-result-summary"
>
	<p class="font-mono text-xs font-bold tracking-wide text-primary">
		{$_('codex.resultsCount', { values: { count: formatCount(total) } })}
	</p>
	<ul class="flex flex-wrap gap-1.5" aria-label={$_('codex.rarityResults')}>
		{#each cardRarityOptions as rarity (rarity.code)}
			{@const count = rarityResults[rarity.code] ?? 0}
			<li>
				<span
					class="inline-flex min-h-7 items-center gap-1 border bg-card/75 px-2 font-mono text-[10px] font-bold tracking-wide"
					style={`border-color:color-mix(in srgb, ${rarity.color} 55%, transparent);color:${rarity.color}`}
					aria-label={$_('codex.rarityResultsCount', {
						values: { rarity: rarity.value, count: formatCount(count) }
					})}
				>
					<span>{rarity.initials}</span>
					<span class="text-foreground">{formatCount(count)}</span>
				</span>
			</li>
		{/each}
	</ul>
</section>
