<script lang="ts">
	import { _ } from '$lib/i18n';
	import { cardNumberLabel, type CardRecord } from '$lib/types';
	let { card }: { card: CardRecord } = $props();
	const facts = $derived([
		{ label: $_('collection.variants'), value: card.variant.name },
		{ label: $_('codex.owned'), value: card.ownedCount },
		...(card.packId == null ? [] : [{ label: $_('boosters.title'), value: `#${card.packId}` }]),
		...(cardNumberLabel(card) ? [{ label: '#', value: cardNumberLabel(card) }] : [])
	]);
</script>

<dl
	class="grid grid-cols-2 divide-x divide-y divide-primary/10 border border-primary/20 sm:grid-cols-4"
>
	{#each facts as fact (fact.label)}
		<div class="p-2">
			<dt class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
				{fact.label}
			</dt>
			<dd class="font-mono text-base text-primary">{fact.value}</dd>
		</div>
	{/each}
</dl>
