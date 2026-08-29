<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import CheckIcon from '@lucide/svelte/icons/check';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';
	import type { WishlistGroups, WishlistRegistrySummary } from '$lib/types';

	let {
		groups,
		activeId,
		onSelect,
		onCreate,
		onEdit,
		onDelete,
		onAccept,
		onDecline,
		onLeave
	}: {
		groups: WishlistGroups;
		activeId: string | null;
		onSelect: (wishlist: WishlistRegistrySummary) => void;
		onCreate: () => void;
		onEdit: (wishlist: WishlistRegistrySummary) => void;
		onDelete: (wishlist: WishlistRegistrySummary) => void;
		onAccept: (wishlist: WishlistRegistrySummary) => void | Promise<void>;
		onDecline: (wishlist: WishlistRegistrySummary) => void | Promise<void>;
		onLeave: (wishlist: WishlistRegistrySummary) => void | Promise<void>;
	} = $props();
</script>

{#snippet registryCard(wishlist: WishlistRegistrySummary)}
	<article
		class="min-w-56 snap-start border p-3 {wishlist.id === activeId
			? 'border-primary bg-primary/10'
			: 'border-primary/20 bg-background'}"
	>
		<Button
			variant="ghost"
			class="h-auto w-full justify-start p-0 text-left"
			onclick={() => onSelect(wishlist)}
		>
			{#if wishlist.imageUrl}
				<img src={wishlist.imageUrl} alt="" class="mr-3 size-12 shrink-0 object-cover" />
			{/if}
			<span class="min-w-0">
				<span class="block truncate font-serif text-sm font-black uppercase tracking-tight">
					{wishlist.title}
				</span>
				{#if wishlist.cardCount !== null}<span
						class="mt-1 block font-mono text-[9px] uppercase tracking-widest text-primary"
					>
						{$_('wishlist.total', { values: { count: wishlist.cardCount } })}
					</span>{/if}
				{#if wishlist.ownerName}
					<span
						class="mt-1 block truncate font-mono text-[9px] uppercase tracking-widest text-muted-foreground"
					>
						{$_('wishlist.owner_name', { values: { owner: wishlist.ownerName } })}
					</span>
				{/if}
			</span>
		</Button>
		<div class="mt-3 flex gap-2">
			{#if wishlist.access === 'owned'}
				<Button
					size="icon-sm"
					variant="outline"
					aria-label={$_('wishlist.edit_registry')}
					onclick={() => onEdit(wishlist)}
				>
					<PencilIcon />
				</Button>
				<Button
					size="icon-sm"
					variant="destructive"
					aria-label={$_('wishlist.delete_registry')}
					onclick={() => onDelete(wishlist)}
				>
					<Trash2Icon />
				</Button>
			{:else if wishlist.access === 'shared'}
				<Button size="sm" variant="outline" onclick={() => void onLeave(wishlist)}>
					{$_('wishlist.leave')}
				</Button>
			{/if}
		</div>
	</article>
{/snippet}

<section class="grid gap-4" data-testid="wishlist-hub">
	<div class="border-4 border-double border-primary/30 bg-card p-3">
		<div class="flex items-center justify-between gap-3">
			<p class="forge-label">{$_('wishlist.owned_lists')}</p>
			<Button size="sm" onclick={onCreate}>{$_('wishlist.create_btn')}</Button>
		</div>
		{#if groups.owned.length}
			<div class="mt-3 flex snap-x gap-2 overflow-x-auto pb-1">
				{#each groups.owned as wishlist (wishlist.id)}{@render registryCard(wishlist)}{/each}
			</div>
		{:else}
			<p class="mt-3 text-sm italic text-muted-foreground">{$_('wishlist.no_owned_lists')}</p>
		{/if}
	</div>

	<div class="grid gap-4 lg:grid-cols-2">
		<section class="border border-primary/25 bg-card p-3">
			<p class="forge-label">{$_('wishlist.shared_lists')}</p>
			{#if groups.shared.length}
				<div class="mt-3 flex snap-x gap-2 overflow-x-auto pb-1">
					{#each groups.shared as wishlist (wishlist.id)}{@render registryCard(wishlist)}{/each}
				</div>
			{:else}
				<p class="mt-3 text-sm italic text-muted-foreground">{$_('wishlist.no_shared_lists')}</p>
			{/if}
		</section>

		<section class="border border-primary/25 bg-card p-3">
			<p class="forge-label">{$_('wishlist.pending_invitations')}</p>
			{#if groups.pending.length}
				<ul class="mt-3 grid gap-2">
					{#each groups.pending as wishlist (wishlist.id)}
						<li
							class="flex flex-wrap items-center gap-2 border border-primary/20 bg-background p-3"
						>
							<div class="min-w-0 flex-1">
								<p class="truncate font-serif font-bold">{wishlist.title}</p>
								<p class="text-xs text-muted-foreground">
									{$_('wishlist.owner_name', { values: { owner: wishlist.ownerName ?? '—' } })}
								</p>
								{#if wishlist.invitedAt}
									<p
										class="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
									>
										{$_('wishlist.invitation_expires', {
											values: {
												date: new Date(
													new Date(wishlist.invitedAt).getTime() + 3 * 86_400_000
												).toLocaleString('fr-FR')
											}
										})}
									</p>
								{/if}
							</div>
							<Button
								size="icon-sm"
								aria-label={$_('wishlist.accept_invitation')}
								onclick={() => void onAccept(wishlist)}><CheckIcon /></Button
							>
							<Button
								size="icon-sm"
								variant="destructive"
								aria-label={$_('wishlist.decline_invitation')}
								onclick={() => void onDecline(wishlist)}><XIcon /></Button
							>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-3 text-sm italic text-muted-foreground">
					{$_('wishlist.no_pending_invitations')}
				</p>
			{/if}
		</section>
	</div>
</section>
