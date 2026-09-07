<script lang="ts">
	import { resolve } from '$app/paths';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { cardRarityByCode } from '$lib/domain/cards/rarities';
	import type { CardRarityInitials } from '$lib/types';
	import type { FriendOwnerInfo } from '$lib/types';

	let {
		friends,
		onPrepareTrade
	}: {
		friends: FriendOwnerInfo[];
		onPrepareTrade?: (friend: FriendOwnerInfo, rarity: string) => void;
	} = $props();

	function rarityStyle(rarity: string) {
		const definition = cardRarityByCode[rarity as CardRarityInitials];
		return definition ? `border-color:${definition.color};color:${definition.color}` : undefined;
	}
</script>

<div>
	<p class="font-mono text-[10px] uppercase tracking-widest text-primary">{$_('codex.friends')}</p>
	{#if friends.length}<ul class="mt-3 divide-y divide-primary/10 border-y border-primary/10">
			{#each friends as friend (friend.friendId)}<li
					class="flex flex-wrap items-center justify-between gap-3 py-3 font-mono text-[10px] uppercase tracking-widest text-foreground"
				>
					<a href={resolve('/users/[id]', { id: friend.friendId })} class="truncate hover:text-primary"
						>@{friend.username}</a
					><div class="flex flex-wrap justify-end gap-1">
						{#each Object.entries(friend.rarityCounts ?? {}) as [rarity, count] (rarity)}
							{#if onPrepareTrade}
								<Button size="sm" variant="outline" class="h-7 px-2 text-[9px]" style={rarityStyle(rarity)} onclick={() => onPrepareTrade(friend, rarity)} aria-label={$_('cardDetail.prepare_trade_rarity', { values: { user: friend.username, rarity, count } })}>{rarity} ×{count}</Button>
							{:else}<span class="border px-1.5 py-1" style={rarityStyle(rarity)}>{rarity} ×{count}</span>{/if}
						{/each}
					</div>
				</li>{/each}
		</ul>{:else}<p class="mt-3 italic text-muted-foreground">
			{$_('codex.noFriends')}
		</p>{/if}
</div>
