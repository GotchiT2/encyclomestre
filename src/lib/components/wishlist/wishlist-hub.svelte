<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import type { WishlistRegistrySummary } from '$lib/types';

	let {
		registries,
		activeId,
		onSelect,
		onCreate,
		onDelete
	}: {
		registries: WishlistRegistrySummary[];
		activeId: string | null;
		onSelect: (id: string) => void;
		onCreate: () => void;
		onDelete: (registry: WishlistRegistrySummary) => void;
	} = $props();
</script>

<section class="border-4 border-double border-primary/30 bg-card p-3">
	<div class="flex items-center justify-between gap-3">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('wishlist.hub_title')}
		</p>
		<Button size="sm" onclick={onCreate}>{$_('wishlist.create_btn')}</Button>
	</div>
	<div class="mt-3 flex snap-x gap-2 overflow-x-auto pb-1">
		{#each registries as registry (registry.id)}
			<div
				class="min-w-52 snap-start border p-3 {registry.id === activeId
					? 'border-primary bg-primary/10'
					: 'border-primary/20 bg-background'}"
			>
				<Button
					variant="ghost"
					class="h-auto w-full justify-start p-0 text-left"
					onclick={() => onSelect(registry.id)}
				>
					<span>
						<span class="block font-serif text-sm font-black uppercase tracking-tight"
							>{registry.title}</span
						>
						<span class="mt-1 block font-mono text-[9px] uppercase tracking-widest text-primary"
							>{$_('wishlist.total', { values: { count: registry.cardIds.length } })}</span
						>
						<span class="mt-1 block font-mono text-[9px] uppercase tracking-widest text-emerald-300"
							>{$_('wishlist.trade_match_alert')} · {registry.opportunityCount}</span
						>
					</span>
				</Button>
				<Button
					class="mt-3"
					size="xs"
					variant="destructive"
					aria-label={$_('wishlist.delete_registry')}
					onclick={() => onDelete(registry)}><Trash2Icon />{$_('wishlist.delete_registry')}</Button
				>
			</div>
		{/each}
	</div>
</section>
