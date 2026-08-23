<script lang="ts">
	import { cardRarityOptions, type CardRarityCode } from '$lib/domain/cards/rarities';
	import { _ } from '$lib/i18n';

	let {
		total,
		loaded,
		hasNext,
		rarityResults
	}: {
		total: number;
		loaded: number;
		hasNext: boolean;
		rarityResults: Partial<Record<CardRarityCode, number>>;
	} = $props();

	const countLabel = $derived(
		total >= 0
			? $_('collection.result_count', { values: { count: total } })
			: hasNext
				? $_('collection.loaded_count_more', { values: { count: loaded } })
				: $_('collection.result_count', { values: { count: loaded } })
	);
</script>

<section class="flex flex-wrap items-center justify-between gap-3 border-y border-primary/20 py-3">
	<p class="forge-label">{countLabel}</p>
	<ul class="flex flex-wrap gap-1.5" aria-label={$_('codex.rarityResults')}>
		{#each cardRarityOptions as rarity (rarity.code)}
			{#if rarityResults[rarity.code] !== undefined}
				<li
					class="border bg-background/70 px-2 py-1 font-mono text-[9px] font-bold tracking-wider"
					style={`border-color:${rarity.color};color:${rarity.color}`}
				>
					{rarity.code} · {rarityResults[rarity.code]?.toLocaleString('fr-FR')}
				</li>
			{/if}
		{/each}
	</ul>
</section>
