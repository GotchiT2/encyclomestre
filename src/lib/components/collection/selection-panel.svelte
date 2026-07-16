<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CollectionTag } from '$lib/types';

	let {
		selectedCount,
		tags,
		bulkTagId = $bindable(''),
		onSelectAll,
		onApply,
		onCancel
	}: {
		selectedCount: number;
		tags: CollectionTag[];
		bulkTagId: string;
		onSelectAll: () => void;
		onApply: () => void;
		onCancel: () => void;
	} = $props();
</script>

<section
	class="fixed inset-x-0 bottom-0 z-40 border-4 border-double border-primary/30 bg-card p-3 shadow-2xl"
	aria-label={$_('collection.bulkActions')}
>
	<div class="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('collection.selectedCards', { values: { count: selectedCount } })}
		</p>
		<div class="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
			<Button size="sm" variant="outline" onclick={onSelectAll}>{$_('collection.selectAll')}</Button
			><select
				bind:value={bulkTagId}
				class="h-9 min-w-0 flex-1 border border-primary/30 bg-background px-3 font-mono text-xs uppercase tracking-wider text-foreground outline-none focus:border-primary"
				><option value="">{$_('collection.chooseTag')}</option>{#each tags as tag (tag.id)}<option
						value={tag.id}>{tag.name}</option
					>{/each}</select
			><Button size="sm" disabled={!bulkTagId || !selectedCount} onclick={onApply}
				>{$_('collection.applyTag')}</Button
			><Button size="sm" variant="ghost" onclick={onCancel}>{$_('common.cancel')}</Button>
		</div>
	</div>
</section>
