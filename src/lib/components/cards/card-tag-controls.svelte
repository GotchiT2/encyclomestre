<script lang="ts">
	import TagEditor from '$lib/components/collection/tag-editor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CollectionTag, CollectionTagAssignments } from '$lib/types';

	let {
		cardId,
		tags = $bindable<CollectionTag[]>([]),
		assignments = $bindable<CollectionTagAssignments>({})
	}: {
		cardId: string;
		tags: CollectionTag[];
		assignments: CollectionTagAssignments;
	} = $props();
	let editorOpen = $state(false);
	let tagToAdd = $state('');
	const assignedTags = $derived(tags.filter((tag) => (assignments[cardId] ?? []).includes(tag.id)));

	function addTag() {
		if (!tagToAdd) return;
		assignments = {
			...assignments,
			[cardId]: [...new Set([...(assignments[cardId] ?? []), tagToAdd])]
		};
		tagToAdd = '';
	}

	function removeTag(tagId: string) {
		assignments = {
			...assignments,
			[cardId]: (assignments[cardId] ?? []).filter((id) => id !== tagId)
		};
	}
</script>

<section class="border border-primary/25 bg-card p-4">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('collection.tags')}
		</p>
		<TagEditor bind:open={editorOpen} bind:tags bind:assignments />
	</div>
	<div class="mt-3 flex flex-wrap gap-1.5">
		{#each assignedTags as tag (tag.id)}
			<Button
				size="xs"
				variant="outline"
				style={`background-color:${tag.color};border-color:${tag.color};color:#080A09`}
				onclick={() => removeTag(tag.id)}>{tag.name} ×</Button
			>
		{/each}
	</div>
	<div class="mt-3 flex flex-wrap gap-2">
		<select
			bind:value={tagToAdd}
			class="h-9 min-w-44 flex-1 border-2 border-primary/40 bg-background px-3 font-mono text-[10px] uppercase tracking-wider text-primary outline-none focus:border-primary"
		>
			<option value="">{$_('cardDetail.choose_tag')}</option>
			{#each tags.filter((tag) => !assignedTags.some((assigned) => assigned.id === tag.id)) as tag (tag.id)}
				<option value={tag.id}>{tag.name}</option>
			{/each}
		</select>
		<Button size="sm" variant="outline" onclick={addTag}>{$_('cardDetail.add_tag')}</Button>
	</div>
</section>
