<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
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
	let draftTagVisibility = $state<import('$lib/types').ProfileVisibility>('FRIENDS');
	let editingTagId = $state<string | null>(null);
	let editingTagName = $state('');
	let editingTagColor = $state('#C19A6B');
	let editingTagVisibility = $state<import('$lib/types').ProfileVisibility>('FRIENDS');

	async function createTag() {
		const name = draftTagName.trim();
		if (
			!name ||
			tags.some((tag) => tag.name.localeCompare(name, 'fr', { sensitivity: 'accent' }) === 0)
		)
			return;
		const created = await createWikiForgeTag({
			name,
			color: draftTagColor,
			visibility: draftTagVisibility
		});
		tags = [...tags, created];
		draftTagName = '';
		draftTagColor = '#C19A6B';
	}

	async function saveTag() {
		const name = editingTagName.trim();
		if (!editingTagId || !name) return;
		const updated = await updateWikiForgeTag(editingTagId, {
			name,
			color: editingTagColor,
			visibility: editingTagVisibility
		});
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

<Dialog.Root bind:open>
	<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}
		>{$_('collection.editTags')}</Dialog.Trigger
	>
	<Dialog.Content
		class="max-h-[calc(100dvh-2rem)] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0"
	>
		<Dialog.Header class="border-b border-primary/20 px-5 py-4 pr-14"
			><Dialog.Title>{$_('collection.tags')}</Dialog.Title><Dialog.Description
				>{$_('collection.tagsDescription')}</Dialog.Description
			></Dialog.Header
		>
		<div class="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 py-4">
			<div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_4rem_9rem_auto]">
				<Input
					bind:value={draftTagName}
					placeholder={$_('collection.tagName')}
					aria-label={$_('collection.tagName')}
					onkeydown={(event) => event.key === 'Enter' && createTag()}
				/><input
					bind:value={draftTagColor}
					type="color"
					aria-label={$_('collection.tagColor')}
					class="h-11 w-full border border-primary/35 bg-background/70 p-1"
				/><select bind:value={draftTagVisibility} aria-label={$_('collection.tagVisibility')}>
					<option value="PRIVATE">{$_('collection.visibilityPrivate')}</option>
					<option value="FRIENDS">{$_('collection.visibilityFriends')}</option>
					<option value="PUBLIC">{$_('collection.visibilityPublic')}</option>
				</select><Button onclick={createTag}>{$_('collection.createTag')}</Button>
			</div>
			{#if tags.length}<ul
					class="flex max-h-[48dvh] flex-col gap-2 overflow-y-auto pr-1 lg:max-h-[52dvh]"
				>
					{#each tags as tag (tag.id)}<li
							class="flex flex-wrap items-center gap-2 border-t border-dashed border-primary/20 pt-2"
						>
							{#if editingTagId === tag.id}<div
									class="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_4rem_9rem_auto_auto]"
								>
									<Input bind:value={editingTagName} aria-label={$_('collection.tagName')} />
									<input
										bind:value={editingTagColor}
										type="color"
										aria-label={$_('collection.tagColor')}
										class="h-11 w-full border border-primary/35 bg-background/70 p-1"
									/><select
										bind:value={editingTagVisibility}
										aria-label={$_('collection.tagVisibility')}
									>
										<option value="PRIVATE">{$_('collection.visibilityPrivate')}</option>
										<option value="FRIENDS">{$_('collection.visibilityFriends')}</option>
										<option value="PUBLIC">{$_('collection.visibilityPublic')}</option>
									</select>
									<Button size="sm" onclick={saveTag}>{$_('common.save')}</Button>
									<Button size="sm" variant="ghost" onclick={() => (editingTagId = null)}
										>{$_('common.cancel')}</Button
									>
								</div>
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
										editingTagVisibility = tag.visibility ?? 'FRIENDS';
									}}>{$_('collection.renameTag')}</Button
								><Button size="sm" variant="ghost" onclick={() => deleteTag(tag.id)}
									>{$_('collection.deleteTag')}</Button
								>{/if}
						</li>{/each}
				</ul>{/if}
		</div>
		<Dialog.Footer class="border-t border-primary/20 px-5 py-3"
			><Dialog.Close class={buttonVariants({ variant: 'outline' })}
				>{$_('common.cancel')}</Dialog.Close
			></Dialog.Footer
		>
	</Dialog.Content>
</Dialog.Root>
