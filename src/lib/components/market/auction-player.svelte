<script lang="ts">
	import { resolve } from '$app/paths';
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import type { AuctionUser } from '$lib/types';
	import type { UserIdentity } from '$lib/api/player-profile';
	let {
		player,
		identity,
		label
	}: { player: AuctionUser; identity?: UserIdentity | null; label: string } = $props();
</script>

<a
	href={resolve('/users/[id]', { id: player.id })}
	class="auction-player"
	data-testid="auction-player"
>
	<UserAvatar
		image={identity?.image}
		crop={identity?.imageCrop}
		name={player.name}
		class="size-8"
	/>
	<span class="min-w-0"
		><span class="block text-xs text-muted-foreground">{label}</span><strong
			class="block truncate text-sm">{player.name}</strong
		></span
	>
</a>

<style>
	.auction-player {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		min-height: 44px;
	}
</style>
