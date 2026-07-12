<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CardRecord, FriendOwnerInfo } from '$lib/types';

	type OwnerGroup = { friend: FriendOwnerInfo; cards: CardRecord[] };
	let {
		cards,
		onInitiateTrade
	}: {
		cards: CardRecord[];
		onInitiateTrade: (friend: FriendOwnerInfo, cards: CardRecord[]) => void;
	} = $props();
	const groups = $derived.by(() => {
		const entries = new Map<string, OwnerGroup>();
		for (const card of cards) {
			for (const friend of card.friendsWhoOwn) {
				const group = entries.get(friend.friendId) ?? { friend, cards: [] };
				group.cards.push(card);
				entries.set(friend.friendId, group);
			}
		}
		return [...entries.values()].toSorted((left, right) => right.cards.length - left.cards.length);
	});
</script>

{#if groups.length}
	<div class="grid gap-3 lg:grid-cols-2">
		{#each groups as group (group.friend.friendId)}
			<article class="border-4 border-double border-primary/30 bg-card p-4">
				<div class="flex items-center gap-3">
					<img
						src={group.friend.avatarUrl}
						alt=""
						class="size-10 border border-primary/40 bg-background object-cover"
					/>
					<div>
						<h3 class="font-serif text-xl font-black uppercase">@{group.friend.username}</h3>
						<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
							{$_('wishlist.owner_card_count', { values: { count: group.cards.length } })}
						</p>
					</div>
				</div>
				<ul class="mt-4 divide-y divide-primary/10 border-y border-primary/10">
					{#each group.cards as card (card.id)}<li
							class="py-2 font-serif text-sm italic text-muted-foreground"
						>
							{card.title}
						</li>{/each}
				</ul>
				<Button class="mt-4 w-full" onclick={() => onInitiateTrade(group.friend, group.cards)}
					>{$_('wishlist.trade_all_with_owner')}</Button
				>
			</article>
		{/each}
	</div>
{:else}
	<p
		class="border border-dashed border-primary/30 bg-card p-5 font-serif italic text-muted-foreground"
	>
		{$_('wishlist.no_owner_summary')}
	</p>
{/if}
