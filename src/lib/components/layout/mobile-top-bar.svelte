<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { currentSession } from '$lib/auth/session';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import { _ } from '$lib/i18n';
	import UsersIcon from '@lucide/svelte/icons/users';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import PlayerMoney from './player-money.svelte';
	import NotificationBell from '$lib/components/notifications/notification-bell.svelte';
	import { communityNavigation, progressionNavigation } from './nav-items';
</script>

<header
	class="arcade-header fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-2 border-b border-border bg-background px-3 md:sticky md:gap-3 md:px-6"
>
	<a
		href={$currentSession ? resolve('/welcome') : resolve('/')}
		class="min-w-0 flex-1 md:hidden"
		aria-label={$_('arcade.recap')}
		><span class="forge-wordmark block truncate text-lg">{$_('navigation.brand')}</span></a
	>
	<div class="hidden min-w-0 flex-1 md:block"></div>
	<PlayerMoney />
	{#if $currentSession}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="grid size-11 shrink-0 place-items-center border border-border hover:border-primary"
				aria-label={$_('arcade.community')}><UsersIcon class="size-5" /></DropdownMenu.Trigger
			>
			<DropdownMenu.Content align="end" class="min-w-56">
				<DropdownMenu.Label>{$_('arcade.community')}</DropdownMenu.Label>
				{#each communityNavigation as item (item.href)}<DropdownMenu.Item
						class="min-h-11"
						onSelect={() => void goto(resolve(item.href))}
						><item.icon />{$_(item.label)}</DropdownMenu.Item
					>{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		<NotificationBell compact />
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="grid size-11 shrink-0 place-items-center"
				aria-label={$_('arcade.account')}
				><UserAvatar
					name={$currentSession.user.username}
					image={$currentSession.user.avatarUrl}
					crop={$currentSession.user.imageCrop}
				/></DropdownMenu.Trigger
			>
			<DropdownMenu.Content align="end" class="min-w-56">
				<DropdownMenu.Label>{$currentSession.user.username}</DropdownMenu.Label>
				<DropdownMenu.Item class="min-h-11" onSelect={() => void goto(resolve('/profile'))}
					>{$_('navigation.profile')}</DropdownMenu.Item
				>
				{#each progressionNavigation as item (item.href)}<DropdownMenu.Item
						class="min-h-11"
						onSelect={() => void goto(resolve(item.href))}
						><item.icon />{$_(item.label)}</DropdownMenu.Item
					>{/each}
				<DropdownMenu.Item class="min-h-11" onSelect={() => void goto(resolve('/settings'))}
					>{$_('navigation.settings')}</DropdownMenu.Item
				>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}<a
			href={resolve('/login')}
			class="grid size-11 place-items-center border border-border"
			aria-label={$_('navigation.login')}><LogInIcon class="size-5" /></a
		>{/if}
</header>
