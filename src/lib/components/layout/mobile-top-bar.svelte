<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { currentSession } from '$lib/auth/session';
	import { clearSession } from '$lib/auth/session';
	import { logout } from '$lib/api';
	import { page } from '$app/state';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import { _ } from '$lib/i18n';
	import UsersIcon from '@lucide/svelte/icons/users';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import PlayerMoney from './player-money.svelte';
	import NotificationBell from '$lib/components/notifications/notification-bell.svelte';
	import {
		communityNavigation,
		progressionNavigation,
		exploreNavigation,
		transactionNavigation,
		isActiveRoute
	} from './nav-items';
	async function signOut() {
		try {
			await logout();
		} catch {
			/* Local logout remains available offline. */
		}
		clearSession(localStorage);
		await goto(resolve('/'));
	}
	const tabs = [
		exploreNavigation[0],
		exploreNavigation[2],
		exploreNavigation[1],
		exploreNavigation[3],
		{ ...transactionNavigation[0], label: 'arcade.market' }
	];
</script>

<header class="arcade-header">
	<a
		href={$currentSession ? resolve('/welcome') : resolve('/')}
		class="arcade-brand"
		aria-label={$_('arcade.recap')}
		><span class="brand-emblem" aria-hidden="true">E<span>↗</span></span><span
			class="forge-wordmark brand-name">{$_('navigation.brand')}</span
		></a
	>
	{#if $currentSession}<nav class="desktop-navigation" aria-label={$_('navigation.mobileAria')}>
			{#each tabs as item (item.href)}
				{@const active =
					isActiveRoute(page.url.pathname, item.href) ||
					(item.href === '/market' && page.url.pathname.startsWith('/trades'))}
				<a href={resolve(item.href)} class:active aria-current={active ? 'page' : undefined}
					><item.icon class="size-4" /><span>{$_(item.label)}</span></a
				>
			{/each}
		</nav>{/if}
	<div class="header-resources">
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
					<DropdownMenu.Separator />
					<DropdownMenu.Item class="min-h-11" onSelect={() => void signOut()}
						>{$_('navigation.logout')}</DropdownMenu.Item
					>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{:else}<a
				href={resolve('/login')}
				class="grid size-11 place-items-center border border-border"
				aria-label={$_('navigation.login')}><LogInIcon class="size-5" /></a
			>{/if}
	</div>
</header>

<style>
	.arcade-header {
		position: sticky;
		top: 0;
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 12px;
		height: 64px;
		padding: 8px 16px;
		border-bottom: 1px solid var(--border);
		background: var(--background);
	}
	.arcade-brand {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 44px;
		flex: none;
	}
	.brand-emblem {
		display: grid;
		position: relative;
		place-items: center;
		width: 40px;
		height: 40px;
		background: var(--primary);
		color: var(--primary-foreground);
		font:
			900 32px/1 'Barlow Condensed',
			sans-serif;
		clip-path: polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%);
	}
	.brand-emblem span {
		position: absolute;
		right: 3px;
		bottom: 2px;
		font-size: 12px;
	}
	.brand-name {
		display: none;
		font-size: 24px;
	}
	.desktop-navigation {
		display: none;
	}
	.header-resources {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-left: auto;
		min-width: 0;
	}
	@media (min-width: 1024px) {
		.arcade-header {
			gap: 24px;
			padding-inline: 24px;
		}
		.desktop-navigation {
			display: flex;
			gap: 4px;
			align-items: center;
		}
		.desktop-navigation a {
			display: flex;
			align-items: center;
			gap: 7px;
			min-height: 44px;
			padding: 8px 12px;
			font-weight: 600;
			font-size: 14px;
			border-bottom: 2px solid transparent;
		}
		.desktop-navigation a.active {
			border-color: var(--primary);
			color: var(--primary);
		}
		.desktop-navigation a:hover {
			background: var(--muted);
		}
		.header-resources {
			gap: 8px;
		}
	}
	@media (min-width: 1280px) {
		.brand-name {
			display: block;
		}
	}
	@media (max-width: 389px) {
		.arcade-header {
			padding-inline: 10px;
			gap: 8px;
		}
		.header-resources {
			gap: 2px;
		}
	}
</style>
