<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { normalizeTagSearch, matchingTag } from '$lib/collection/tag-search';
	import type { CollectionTag } from '$lib/types';
	let {
		tags,
		selected = [],
		search = $bindable(''),
		onSelect,
		onCreate,
		busy = false,
		allowDeselect = true
	}: {
		tags: CollectionTag[];
		selected?: string[];
		search?: string;
		onSelect: (id: string) => void;
		onCreate?: (name: string) => void;
		busy?: boolean;
		allowDeselect?: boolean;
	} = $props();
	const choices = $derived(
		tags.filter((tag) => normalizeTagSearch(tag.name).includes(normalizeTagSearch(search)))
	);
	const newName = $derived(search.trim());
</script>

<div class="grid min-w-0 gap-2" data-testid="tag-choices">
	<Input
		type="search"
		bind:value={search}
		maxlength={64}
		disabled={busy}
		aria-label={$_('controls.tagSearch')}
		placeholder={$_('controls.tagSearch')}
		onkeydown={(event) => {
			if (event.key !== 'Enter' || event.isComposing || busy || !newName) return;
			const tag = matchingTag(tags, newName);
			if (tag) {
				event.preventDefault();
				onSelect(tag.id);
			} else if (onCreate) {
				event.preventDefault();
				onCreate(newName);
			}
		}}
	/>
	<div class="max-h-60 overflow-y-auto" role="group" aria-label={$_('collection.tags')}>
		{#each choices as tag (tag.id)}<button
				type="button"
				class="flex min-h-11 w-full items-center gap-2 px-2 text-left hover:bg-secondary"
				aria-pressed={selected.includes(tag.id)}
				disabled={busy || (!allowDeselect && selected.includes(tag.id))}
				onclick={() => onSelect(tag.id)}
			>
				<span aria-hidden="true">{selected.includes(tag.id) ? '✓' : '○'}</span>
				<span class="size-3 shrink-0 border border-border" style:background={tag.color}></span>
				<span class="min-w-0 break-words">{tag.name}</span>
			</button>{:else}<p class="px-2 py-3 text-sm text-muted-foreground">
				{$_('controls.noTags')}
			</p>{/each}
	</div>
	{#if onCreate && newName && !matchingTag(tags, newName)}<Button
			disabled={busy}
			onclick={() => onCreate?.(newName)}
			>{$_('controls.createAndAdd', { values: { name: newName } })}</Button
		>{/if}
</div>
