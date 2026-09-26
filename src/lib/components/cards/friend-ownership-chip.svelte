<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { _ } from '$lib/i18n';
	import UsersIcon from '@lucide/svelte/icons/users';
	import type { FriendOwnerInfo } from '$lib/types';

	let { owners }: { owners: FriendOwnerInfo[] } = $props();
	const firstOwner = $derived(owners[0]);
</script>

{#if firstOwner}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class="absolute bottom-[3%] left-[7%] z-40 flex max-w-[72%] items-center gap-1 border border-energy/70 bg-background/95 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wide text-energy shadow-lg transition-colors hover:bg-energy/15 focus-visible:outline-2 focus-visible:outline-energy"
			aria-label={$_('cardState.friend_owners', { values: { count: owners.length } })}
			data-testid="friend-ownership-chip"
		>
			<UsersIcon class="size-3 shrink-0" />
			<span class="truncate">@{firstOwner.username}</span>
			{#if owners.length > 1}<span class="shrink-0">+{owners.length - 1}</span>{/if}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content
			preventScroll={false}
			align="start"
			side="top"
			sideOffset={6}
			class="min-w-52 border border-energy/45 bg-card p-1 shadow-2xl"
		>
			{#each owners as owner (owner.friendId)}
				<DropdownMenu.Item class="flex min-h-9 items-center justify-between gap-3" disabled>
					<span class="truncate">@{owner.username}</span>
					<span class="shrink-0 font-mono text-[9px] text-energy">×{owner.ownedCount}</span>
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
