<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { currentSession } from '$lib/auth/session';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import UserPresence from '$lib/components/users/user-presence.svelte';
	import { _ } from '$lib/i18n';
	import {
		communityNavigation,
		exploreNavigation,
		transactionNavigation,
		progressionNavigation,
		isActiveRoute,
		type NavItem
	} from './nav-items';
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import PackageOpenIcon from '@lucide/svelte/icons/package-open';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import NotificationBell from '$lib/components/notifications/notification-bell.svelte';
	import AchievementNavBadge from '$lib/components/achievements/achievement-nav-badge.svelte';

	const sidebar = Sidebar.useSidebar();

	/** Le tiroir mobile réutilise cette sidebar : il faut le refermer après une navigation. */
	function closeOnMobile() {
		if (sidebar.isMobile) sidebar.setOpenMobile(false);
	}
</script>

{#snippet navGroup(label: string, items: NavItem[])}
	<Sidebar.Group>
		<Sidebar.GroupLabel class="forge-label">{$_(label)}</Sidebar.GroupLabel>
		<Sidebar.GroupContent>
			<Sidebar.Menu>
				{#each items as item (item.href)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={isActiveRoute(page.url.pathname, item.href)}
							tooltipContent={$_(item.label)}
						>
							{#snippet child({ props })}
								<a href={resolve(item.href)} onclick={closeOnMobile} {...props}>
									<item.icon />
									<span>{$_(item.label)}</span>
									{#if item.href === '/achievements'}<AchievementNavBadge />{/if}
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/each}
			</Sidebar.Menu>
		</Sidebar.GroupContent>
	</Sidebar.Group>
{/snippet}

<Sidebar.Root
	collapsible="icon"
	class="border-e border-primary/25 backdrop-blur-xl"
	aria-label={$_('navigation.sidebarAria')}
>
	<Sidebar.Header class="gap-3 border-b border-primary/20 p-2">
		<div
			class="flex items-center gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-3"
		>
			<a
				href={resolve('/')}
				onclick={closeOnMobile}
				class="flex min-w-0 items-center gap-3"
				aria-label={$_('navigation.home')}
			>
				<span
					class="relative grid size-8 shrink-0 place-items-center border border-primary/45 bg-card text-primary"
				>
					<span class="absolute inset-1 border border-[rgb(124_228_222_/_18%)]"></span>
					<GalleryVerticalEndIcon class="relative size-4" />
				</span>
				<span class="min-w-0 group-data-[collapsible=icon]:hidden">
					<span class="forge-wordmark block truncate text-lg leading-none"
						>{$_('navigation.brand')}</span
					>
					<span
						class="mt-1 block truncate text-[8px] font-bold tracking-[0.25em] text-[var(--energy-soft)] uppercase"
					>
						{$_('navigation.forgeNetwork')}
					</span>
				</span>
			</a>
			<Sidebar.Trigger
				class="ml-auto shrink-0 border border-primary/30 text-primary group-data-[collapsible=icon]:ml-0"
				title={$_('navigation.toggleSidebar')}
				aria-label={$_('navigation.toggleSidebar')}
			/>
		</div>
	</Sidebar.Header>

	<Sidebar.Content>
		{@render navGroup('navigation.sectionExplore', exploreNavigation)}
		{@render navGroup('plan.navigation.transactions', transactionNavigation)}
		{@render navGroup('navigation.sectionCommunity', communityNavigation)}
		{@render navGroup('plan.navigation.progression', progressionNavigation)}
	</Sidebar.Content>

	<Sidebar.Footer class="gap-2 border-t border-primary/20 p-2">
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					class="forge-sidebar-cta"
					isActive={isActiveRoute(page.url.pathname, '/boosters')}
					tooltipContent={$_('navigation.openBooster')}
				>
					{#snippet child({ props })}
						<a href={resolve('/boosters')} onclick={closeOnMobile} {...props}>
							<PackageOpenIcon />
							<span>{$_('navigation.openBooster')}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>

			{#if $currentSession}
				<Sidebar.MenuItem><NotificationBell /></Sidebar.MenuItem>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={$_('navigation.profile')}>
						{#snippet child({ props })}
							<a href={resolve('/profile')} onclick={closeOnMobile} {...props}>
								<span class="relative shrink-0">
									<UserRoundIcon />
									<UserPresence value={$currentSession.user.lastConnection} size="sm" />
								</span>
								<span>{$currentSession.user.username}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={$_('navigation.settings')}>
						{#snippet child({ props })}
							<a href={resolve('/settings')} onclick={closeOnMobile} {...props}>
								<SettingsIcon />
								<span>{$_('navigation.settings')}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{:else}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={$_('navigation.login')}>
						{#snippet child({ props })}
							<a href={resolve('/login')} onclick={closeOnMobile} {...props}>
								<LogInIcon />
								<span>{$_('navigation.login')}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={$_('navigation.register')}>
						{#snippet child({ props })}
							<a href={resolve('/register')} onclick={closeOnMobile} {...props}>
								<UserPlusIcon />
								<span>{$_('navigation.register')}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/if}
		</Sidebar.Menu>
	</Sidebar.Footer>

	<Sidebar.Rail />
</Sidebar.Root>
