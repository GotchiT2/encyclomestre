<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import TagFilterSelector from '$lib/components/collection/tag-filter-selector.svelte';
	import { _ } from '$lib/i18n';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import type { CollectionTag } from '$lib/types';

	let {
		selectedCount,
		tags,
		bulkTagIds = $bindable<string[]>([]),
		canProtect = false,
		canUnprotect = false,
		onSelectAll,
		onApply,
		onProtect,
		onUnprotect = () => undefined,
		onOpenTagEditor,
		onCancel
	}: {
		selectedCount: number;
		tags: CollectionTag[];
		bulkTagIds: string[];
		canProtect?: boolean;
		canUnprotect?: boolean;
		onSelectAll: () => void;
		onApply: () => void | Promise<void>;
		onProtect: () => void | Promise<void>;
		onUnprotect?: () => void | Promise<void>;
		onOpenTagEditor: () => void;
		onCancel: () => void;
	} = $props();
	let applying = $state(false);
	let protecting = $state(false);
	let unprotecting = $state(false);

	async function applyTags() {
		applying = true;
		try {
			await onApply();
		} finally {
			applying = false;
		}
	}

	async function protectCards() {
		protecting = true;
		try {
			await onProtect();
		} finally {
			protecting = false;
		}
	}

	async function unprotectCards() {
		unprotecting = true;
		try {
			await onUnprotect();
		} finally {
			unprotecting = false;
		}
	}
</script>

<section
	class="fixed inset-x-0 bottom-0 z-40 border-4 border-double border-primary/30 bg-card p-3 shadow-2xl"
	aria-label={$_('collection.bulkActions')}
>
	<div class="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('collection.selectedCards', { values: { count: selectedCount } })}
		</p>
		<div class="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-end">
			<Button size="sm" class="sm:h-11" variant="outline" onclick={onSelectAll}
				>{$_('collection.selectAll')}</Button
			>
			<div class="min-w-0 flex-1 sm:max-w-xs" data-testid="bulk-tag-selector">
				<TagFilterSelector bind:values={bulkTagIds} {tags} onCreate={onOpenTagEditor} />
			</div>
			<Button
				size="sm"
				class="sm:h-11"
				disabled={!bulkTagIds.length || !selectedCount || applying}
				onclick={applyTags}>{$_('collection.apply_selected_tags')}</Button
			><Button
				size="sm"
				class="sm:h-11"
				variant="outline"
				disabled={!selectedCount || !canProtect || protecting}
				onclick={protectCards}
				><ShieldCheckIcon data-icon="inline-start" />{$_('collection.protect_selection')}</Button
			><Button
				size="sm"
				class="sm:h-11"
				variant="outline"
				disabled={!selectedCount || !canUnprotect || unprotecting}
				onclick={unprotectCards}
				>{$_('collection.unprotect_selection')}</Button
			><Button size="sm" class="sm:h-11" variant="ghost" onclick={onCancel}
				>{$_('common.cancel')}</Button
			>
		</div>
	</div>
</section>
