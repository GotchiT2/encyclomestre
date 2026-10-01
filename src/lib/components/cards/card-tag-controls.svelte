<script lang="ts">
	import { operationError } from '$lib/domain/operation-error';
	import TagEditor from '$lib/components/collection/tag-editor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import { addWikiForgeCardTag, removeWikiForgeCardTag } from '$lib/api';
	import type { CollectionTag, CollectionTagAssignments } from '$lib/types';

	let {
		cardId,
		tags = $bindable<CollectionTag[]>([]),
		assignments = $bindable<CollectionTagAssignments>({}),
		onCardUpdated
	}: {
		cardId: string;
		tags: CollectionTag[];
		assignments: CollectionTagAssignments;
		onCardUpdated?: (card: import('$lib/types').CardRecord) => void;
	} = $props();
	let editorOpen = $state(false);
	let tagToAdd = $state('');
	let busy = $state(false);
	let error = $state('');
	const assignedTags = $derived(tags.filter((tag) => (assignments[cardId] ?? []).includes(tag.id)));

	async function addTag() {
		if (!tagToAdd || busy) return;
		busy = true;
		error = '';
		try {
			const updated = await addWikiForgeCardTag(cardId, tagToAdd);
			assignments = {
				...assignments,
				[cardId]: updated.collectionTagIds ?? []
			};
			onCardUpdated?.(updated);
			tagToAdd = '';
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}

	async function removeTag(tagId: string) {
		if (busy) return;
		busy = true;
		error = '';
		try {
			const updated = await removeWikiForgeCardTag(cardId, tagId);
			assignments = {
				...assignments,
				[cardId]: updated.collectionTagIds ?? []
			};
			onCardUpdated?.(updated);
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}
</script>

<section class="border border-primary/25 bg-card p-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('collection.tags')}
		</p>
		<TagEditor bind:open={editorOpen} bind:tags bind:assignments />
	</div>
	{#if error}<p role="alert">{error}</p>{/if}
	<div class="mt-2 flex flex-wrap gap-1.5">
		{#each assignedTags as tag (tag.id)}
			<Button
				size="xs"
				variant="outline"
				style={`background-color:${tag.color};border-color:${tag.color};color:#080A09`}
				disabled={busy}
				onclick={() => removeTag(tag.id)}>{tag.name} ×</Button
			>
		{/each}
	</div>
	<div class="mt-2 flex flex-wrap gap-2">
		<select
			bind:value={tagToAdd}
			class="h-11 min-w-44 flex-1 border-2 border-primary/40 bg-background px-3 font-mono text-[10px] uppercase tracking-wider text-primary outline-none focus:border-primary"
		>
			<option value="">{$_('cardDetail.choose_tag')}</option>
			{#each tags.filter((tag) => !assignedTags.some((assigned) => assigned.id === tag.id)) as tag (tag.id)}
				<option value={tag.id}>{tag.name}</option>
			{/each}
		</select>
		<Button size="sm" variant="outline" disabled={busy || !tagToAdd} onclick={addTag}
			>{$_('cardDetail.add_tag')}</Button
		>
	</div>
</section>
