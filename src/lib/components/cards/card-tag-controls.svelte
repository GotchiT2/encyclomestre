<script lang="ts">
	import { onDestroy } from 'svelte';
	import { operationError } from '$lib/domain/operation-error';
	import TagChoices from '$lib/components/collection/tag-choices.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import {
		addWikiForgeCardTag,
		removeWikiForgeCardTag,
		createWikiForgeTag,
		getWikiForgeTags,
		getWikiForgeCollectionCard
	} from '$lib/api';
	import { currentSession } from '$lib/auth/session';
	import { matchingTag } from '$lib/collection/tag-search';
	import { publishRealtimeRefresh } from '$lib/realtime/resource-refresh';
	import type { CardRecord, CollectionTag, CollectionTagAssignments } from '$lib/types';
	let {
		cardId,
		tags = $bindable<CollectionTag[]>([]),
		assignments = $bindable<CollectionTagAssignments>({}),
		onCardUpdated
	}: {
		cardId: string;
		tags: CollectionTag[];
		assignments: CollectionTagAssignments;
		onCardUpdated?: (card: CardRecord) => void;
	} = $props();
	let search = $state(''),
		busy = $state(false),
		error = $state('');
	let needsTagRead = false,
		needsCardRead = false,
		disposed = false;
	const accountId = $derived($currentSession?.user.id);
	const assignedIds = $derived(assignments[cardId] ?? []);
	const assignedTags = $derived(tags.filter((tag) => assignedIds.includes(tag.id)));
	$effect(() => {
		void cardId;
		void accountId;
		search = '';
		busy = false;
		error = '';
		needsTagRead = false;
		needsCardRead = false;
	});
	onDestroy(() => {
		disposed = true;
	});
	function accept(updated: CardRecord) {
		assignments = { ...assignments, [updated.id]: updated.collectionTagIds ?? [] };
		onCardUpdated?.(updated);
		publishRealtimeRefresh(['collection', 'profile']);
	}
	async function addTag(name: string, selectedId?: string) {
		name = name.trim();
		if (!name || name.length > 64 || busy) return;
		const id = cardId,
			account = $currentSession?.user.id;
		const current = () => !disposed && id === cardId && account === $currentSession?.user.id;
		busy = true;
		error = '';
		let tag: CollectionTag | undefined,
			creating = false,
			created = false;
		try {
			if (needsTagRead) {
				const result = await getWikiForgeTags();
				if (!current()) return;
				tags = result;
				needsTagRead = false;
			}
			tag = selectedId ? tags.find((item) => item.id === selectedId) : matchingTag(tags, name);
			if (needsCardRead && tag) {
				const updated = await getWikiForgeCollectionCard(id);
				if (!current()) return;
				accept(updated);
				needsCardRead = false;
			}
			if (tag && (assignments[id] ?? []).includes(tag.id)) {
				search = '';
				return;
			}
			if (!tag) {
				creating = true;
				tag = await createWikiForgeTag({ name, color: '#E8EF42', visibility: 'FRIENDS' });
				creating = false;
				created = true;
				if (account !== $currentSession?.user.id) return;
				if (current()) tags = [...tags.filter((item) => item.id !== tag!.id), tag];
			}
			// Complete the requested operation for its original card, even if the inspection closes.
			if (account !== $currentSession?.user.id) return;
			needsCardRead = true;
			const updated = await addWikiForgeCardTag(id, tag.id);
			if (!current()) return;
			needsCardRead = false;
			accept(updated);
			search = '';
		} catch (cause) {
			if (!current()) return;
			if (creating) {
				needsTagRead = true;
				try {
					const result = await getWikiForgeTags();
					if (!current()) return;
					tags = result;
					needsTagRead = false;
				} catch {
					if (current()) error = $_('controls.retryTagState');
					return;
				}
			}
			if (needsCardRead && tag) {
				try {
					const updated = await getWikiForgeCollectionCard(id);
					if (!current()) return;
					accept(updated);
					needsCardRead = false;
					if (updated.collectionTagIds?.includes(tag.id)) {
						search = '';
						return;
					}
				} catch {
					/* A retry will read the card before sending another assignment. */
				}
			}
			error = created ? $_('controls.tagCreatedNotAssigned') : operationError(cause);
		} finally {
			if (current()) busy = false;
		}
	}
	async function removeTag(tagId: string) {
		if (busy) return;
		const id = cardId,
			account = $currentSession?.user.id;
		busy = true;
		error = '';
		try {
			const updated = await removeWikiForgeCardTag(id, tagId);
			if (!disposed && cardId === id && account === $currentSession?.user.id) accept(updated);
		} catch (cause) {
			if (!disposed && cardId === id) error = operationError(cause);
		} finally {
			if (!disposed && cardId === id) busy = false;
		}
	}
</script>

<section
	class="grid min-w-0 gap-3 border border-border bg-card p-3"
	data-testid="card-tag-controls"
>
	<h3 class="font-semibold">{$_('collection.tags')}</h3>
	<div class="flex flex-wrap gap-1.5">
		{#each assignedTags as tag (tag.id)}<Button
				size="xs"
				variant="outline"
				style={'border-color:' + tag.color}
				disabled={busy}
				onclick={() => removeTag(tag.id)}>{tag.name} ×</Button
			>{/each}
	</div>
	<TagChoices
		{tags}
		selected={assignedIds}
		bind:search
		{busy}
		allowDeselect={false}
		onSelect={(id) => {
			const tag = tags.find((item) => item.id === id);
			if (tag) void addTag(tag.name, id);
		}}
		onCreate={(name) => void addTag(name)}
	/>
	{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
</section>
