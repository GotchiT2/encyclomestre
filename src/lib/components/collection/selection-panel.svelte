<script lang="ts">
	import { operationError } from '$lib/domain/operation-error';
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
		onRemove,
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
		onRemove?: () => void | Promise<void>;
		onProtect: () => void | Promise<void>;
		onUnprotect?: () => void | Promise<void>;
		onOpenTagEditor: () => void;
		onCancel: () => void;
	} = $props();
	let applying = $state(false);
	let protecting = $state(false);
	let unprotecting = $state(false);

	let error = $state('');
	async function applyTags(remove = false) {
		if (applying) return;
		error = '';
		applying = true;
		try {
			if (remove) await onRemove?.();
			else await onApply();
		} catch {
			error = $_('completion.errors.generic');
		} finally {
			applying = false;
		}
	}

	async function protectCards() {
		if (protecting || unprotecting || applying) return;
		error = '';
		protecting = true;
		try {
			await onProtect();
		} catch (cause) {
			error = operationError(cause);
		} finally {
			protecting = false;
		}
	}

	async function unprotectCards() {
		if (protecting || unprotecting || applying) return;
		error = '';
		unprotecting = true;
		try {
			await onUnprotect();
		} catch (cause) {
			error = operationError(cause);
		} finally {
			unprotecting = false;
		}
	}
</script>

<section
	data-selection-panel
	class="fixed inset-x-0 bottom-0 z-50 max-h-[42dvh] overflow-y-auto border-t border-primary bg-card p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-2xl md:left-[var(--sidebar-width)]"
	aria-label={$_('collection.bulkActions')}
>
	{#if error}<p role="alert">{error}</p>{/if}
	<div class="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('collection.selectedCards', { values: { count: selectedCount } })}
		</p>
		<div class="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
			<Button size="sm" class="min-h-11" variant="outline" onclick={onSelectAll}
				>{$_('arcade.loadedSelection')}</Button
			>
			<div class="min-w-0 w-full sm:flex-1 sm:max-w-xs" data-testid="bulk-tag-selector">
				<TagFilterSelector bind:values={bulkTagIds} {tags} onCreate={onOpenTagEditor} />
			</div>
			{#if onRemove}<Button
					size="sm"
					class="min-h-11"
					variant="outline"
					disabled={!bulkTagIds.length || !selectedCount || applying}
					onclick={() => applyTags(true)}>{$_('completion.removeTags')}</Button
				>{/if}
			<Button
				size="sm"
				class="min-h-11"
				disabled={!bulkTagIds.length || !selectedCount || applying}
				onclick={() => applyTags()}>{$_('collection.apply_selected_tags')}</Button
			><Button
				size="sm"
				class="min-h-11"
				variant="outline"
				data-testid="protect-selection"
				disabled={!selectedCount || !canProtect || protecting}
				onclick={protectCards}
				><ShieldCheckIcon data-icon="inline-start" />{$_('collection.protect_selection')}</Button
			><Button
				size="sm"
				class="min-h-11"
				variant="outline"
				data-testid="unprotect-selection"
				disabled={!selectedCount || !canUnprotect || unprotecting}
				onclick={unprotectCards}>{$_('collection.unprotect_selection')}</Button
			><Button size="sm" class="min-h-11" variant="ghost" onclick={onCancel}
				>{$_('common.cancel')}</Button
			>
		</div>
	</div>
</section>
