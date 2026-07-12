<script lang="ts">
	import { _ } from '$lib/i18n';
	import type { CardRecord } from '$lib/types';
	let { card }: { card: CardRecord } = $props();
</script>

<section class="border border-primary/30 bg-black p-4">
	<div class="border border-primary/20 bg-background p-2">
		<img src={card.imageUrl} alt={card.title} class="aspect-[3/4] w-full object-cover" />
	</div>
	<p
		class="mt-3 font-mono text-[10px] uppercase tracking-widest"
		style={`color:${card.rarityColor}`}
	>
		{card.rarity} · {card.rarityInitials}
	</p>
	<p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">
		{$_('cardDetail.owned_count', { values: { count: card.ownedCount } })}
	</p>
</section>
