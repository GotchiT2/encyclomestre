<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Sheet from '$lib/components/ui/sheet';
	import { _ } from '$lib/i18n';
	import { createWikiForgeTag, deleteWikiForgeTag, updateWikiForgeTag } from '$lib/api';
	import type { CollectionTag, CollectionTagAssignments } from '$lib/types';

	let {
		open = $bindable(false),
		tags = $bindable<CollectionTag[]>([]),
		assignments = $bindable<CollectionTagAssignments>({})
	}: {
		open: boolean;
		tags: CollectionTag[];
		assignments: CollectionTagAssignments;
	} = $props();

	let draftTagName = $state('');
	let draftTagColor = $state('#C19A6B');
	let editingTagId = $state<string | null>(null);
	let editingTagName = $state('');
	let editingTagColor = $state('#C19A6B');

	async function createTag() {
		const name = draftTagName.trim();
		if (
			!name ||
			tags.some((tag) => tag.name.localeCompare(name, 'fr', { sensitivity: 'accent' }) === 0)
		)
			return;
		const created = await createWikiForgeTag({ name, color: draftTagColor });
		tags = [...tags, created];
		draftTagName = '';
		draftTagColor = '#C19A6B';
	}

	async function saveTag() {
		const name = editingTagName.trim();
		if (!editingTagId || !name) return;
		const updated = await updateWikiForgeTag(editingTagId, { name, color: editingTagColor });
		tags = tags.map((tag) => (tag.id === editingTagId ? updated : tag));
		editingTagId = null;
	}

	async function deleteTag(tagId: string) {
		await deleteWikiForgeTag(tagId);
		tags = tags.filter((tag) => tag.id !== tagId);
		assignments = Object.fromEntries(
			Object.entries(assignments)
				.map(([cardId, tagIds]) => [cardId, tagIds.filter((id) => id !== tagId)])
				.filter(([, tagIds]) => tagIds.length)
		);
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}
		>{$_('collection.editTags')}</Sheet.Trigger
	>
	<Sheet.Content
		side="bottom"
		class="data-[side=bottom]:right-auto data-[side=bottom]:bottom-auto data-[side=bottom]:left-1/2 data-[side=bottom]:-translate-x-1/2 top-1/2 max-h-[85vh] w-[calc(100%-2rem)] max-w-xl -translate-y-1/2 overflow-y-auto border-4 border-double border-primary/30 bg-card"
	>
		<Sheet.Header
			><Sheet.Title>{$_('collection.tags')}</Sheet.Title><Sheet.Description
				>{$_('collection.tagsDescription')}</Sheet.Description
			></Sheet.Header
		>
		<div class="flex flex-col gap-4 px-4">
			<div class="flex flex-col gap-2 sm:flex-row">
				<Input
					bind:value={draftTagName}
					placeholder={$_('collection.tagName')}
					aria-label={$_('collection.tagName')}
					onkeydown={(event) => event.key === 'Enter' && createTag()}
				/><input
					bind:value={draftTagColor}
					type="color"
					aria-label={$_('collection.tagColor')}
					class="size-10 border-2 border-primary/40 bg-card p-1"
				/><Button onclick={createTag}>{$_('collection.createTag')}</Button>
			</div>
			{#if tags.length}<ul class="flex flex-col gap-2">
					{#each tags as tag (tag.id)}<li
							class="flex flex-wrap items-center gap-2 border-t border-dashed border-primary/20 pt-2"
						>
							{#if editingTagId === tag.id}<Input
									bind:value={editingTagName}
									aria-label={$_('collection.tagName')}
								/><label
									class="flex h-10 items-center gap-2 border-2 border-primary/40 bg-card px-2 font-mono text-[10px] uppercase tracking-wider text-primary"
									><span>{$_('collection.tagColor')}</span><input
										bind:value={editingTagColor}
										type="color"
										aria-label={$_('collection.tagColor')}
										class="size-6 border border-primary/40 bg-card p-0.5"
									/></label
								><Button size="sm" onclick={saveTag}>{$_('common.save')}</Button><Button
									size="sm"
									variant="ghost"
									onclick={() => (editingTagId = null)}>{$_('common.cancel')}</Button
								>
							{:else}<span
									class="size-4 border border-primary/70"
									style={`background-color:${tag.color}`}
								></span><span
									class="min-w-24 flex-1 font-mono text-xs uppercase tracking-wider text-foreground"
									>{tag.name}</span
								><Button
									size="sm"
									variant="ghost"
									onclick={() => {
										editingTagId = tag.id;
										editingTagName = tag.name;
										editingTagColor = tag.color;
									}}>{$_('collection.renameTag')}</Button
								><Button size="sm" variant="ghost" onclick={() => deleteTag(tag.id)}
									>{$_('collection.deleteTag')}</Button
								>{/if}
						</li>{/each}
				</ul>{/if}
		</div>
		<Sheet.Footer
			><Sheet.Close class={buttonVariants({ variant: 'outline' })}
				>{$_('common.cancel')}</Sheet.Close
			></Sheet.Footer
		>
	</Sheet.Content>
</Sheet.Root>
