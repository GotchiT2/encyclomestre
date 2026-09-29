<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import ContextualCardRail from '$lib/components/cards/contextual-card-rail.svelte';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';
	import type { CardRecord, ProfileGallery } from '$lib/types';

	let {
		gallery,
		cards,
		editable = true,
		allowCardAdd = editable,
		showTitle = true,
		onAddCard,
		onEditTitle,
		onRemove,
		onRemoveCard
	}: {
		gallery: ProfileGallery;
		cards: CardRecord[];
		editable?: boolean;
		allowCardAdd?: boolean;
		showTitle?: boolean;
		onAddCard?: () => void;
		onEditTitle?: () => void;
		onRemove?: () => void;
		onRemoveCard?: (cardId: string) => void;
	} = $props();
</script>

<section class="border border-primary/25 bg-card p-3">
	{#if showTitle}<header
			class="mb-3 flex items-center justify-between gap-2 border-b border-dashed border-primary/25 pb-2"
		>
			<h3 class="text-lg font-black uppercase tracking-tight text-foreground">
				{gallery.title}
			</h3>
			{#if editable}<div class="flex gap-1">
					<Button
						variant="ghost"
						size="icon-xs"
						aria-label={$_('profile.edit_gallery')}
						onclick={onEditTitle}><PencilIcon /></Button
					>
					<Button
						variant="ghost"
						size="icon-xs"
						aria-label={$_('profile.delete_gallery')}
						onclick={onRemove}><Trash2Icon /></Button
					>
				</div>{/if}
		</header>{/if}
	<ContextualCardRail
		items={cards}
		label={gallery.title}
		itemKey={(card) => card.id}
		desktopGridClass="lg:grid-cols-3 xl:grid-cols-4"
	>
		{#snippet children(card)}
			<div class="wikiforge-card-size relative">
				<CardTile {card} showFriendOwners={false} />
				{#if onRemoveCard}<Button
						variant="destructive"
						size="icon-xs"
						class="absolute top-2 right-2 z-10 border-destructive bg-destructive text-white shadow-lg hover:bg-destructive/90"
						aria-label={$_('profile.remove_card')}
						onclick={() => onRemoveCard?.(card.id)}><XIcon /></Button
					>{/if}
			</div>
		{/snippet}
	</ContextualCardRail>
	<div class="mt-3 flex justify-center">
		{#if allowCardAdd && cards.length < 6}
			<Button
				variant="outline"
				class="wikiforge-card-size aspect-[862/1221] border-dashed"
				onclick={onAddCard}
			>
				<PlusIcon class="size-6" />
			</Button>
		{/if}
	</div>
</section>
