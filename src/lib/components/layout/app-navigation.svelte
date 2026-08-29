<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { getCurrentUserMoney } from '$lib/api/users';
	import { currentSession, persistSession } from '$lib/auth/session';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import { _ } from '$lib/i18n';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import PackageOpenIcon from '@lucide/svelte/icons/package-open';
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
	import HandshakeIcon from '@lucide/svelte/icons/handshake';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import UsersIcon from '@lucide/svelte/icons/users';
	import LibraryBigIcon from '@lucide/svelte/icons/library-big';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import StoreIcon from '@lucide/svelte/icons/store';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import CoinsIcon from '@lucide/svelte/icons/coins';

	const primaryNavigation = [
		{ href: '/cards', label: 'navigation.cards', icon: BookOpenIcon },
		{ href: '/collection', label: 'navigation.collection', icon: LibraryBigIcon },
		{ href: '/market', label: 'navigation.market', icon: StoreIcon }
	];

	const secondaryNavigation = [
		{ href: '/trades', label: 'navigation.trades', icon: HandshakeIcon },
		{ href: '/wishlists', label: 'navigation.wishlist', icon: HeartIcon },
		{ href: '/guild', label: 'navigation.guild', icon: UsersIcon },
		{ href: '/friends', label: 'navigation.friends', icon: UsersIcon },
		{ href: '/messages', label: 'navigation.messages', icon: MessageCircleIcon }
	];

	const mobileNavigation = [
		{ href: '/', label: 'navigation.home', icon: GalleryVerticalEndIcon },
		...primaryNavigation.slice(0, 2),
		{ href: '/boosters', label: 'navigation.boosters', icon: PackageOpenIcon }
	];

	function isActive(href: string) {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}

	onMount(() => {
		const session = $currentSession;
		if (!session || typeof session.user.money === 'number') return;
		void getCurrentUserMoney().then((money) => {
			const activeSession = $currentSession;
			if (!activeSession || activeSession.user.id !== session.user.id) return;
			persistSession(localStorage, {
				...activeSession,
				user: { ...activeSession.user, money }
			});
		});
	});
</script>

<header
	class="fixed inset-x-0 top-0 z-40 border-b border-primary/20 bg-background/88 backdrop-blur-xl"
>
	<div class="mx-auto flex h-18 max-w-screen-2xl items-center gap-3 px-4 sm:px-6 lg:px-10">
		<a
			href={resolve('/')}
			class="group flex shrink-0 items-center gap-3"
			aria-label={$_('navigation.home')}
		>
			<span
				class="relative grid size-10 place-items-center border border-primary/45 bg-card text-primary"
			>
				<span class="absolute inset-1 border border-[rgb(124_228_222_/_18%)]"></span>
				<GalleryVerticalEndIcon class="relative size-5" />
			</span>
			<span class="hidden sm:block">
				<span class="forge-wordmark block text-xl leading-none">{$_('navigation.brand')}</span>
				<span
					class="mt-1 block text-[8px] font-bold tracking-[0.25em] text-[var(--energy-soft)] uppercase"
				>
					{$_('navigation.forgeNetwork')}
				</span>
			</span>
		</a>

		<nav
			class="ml-4 hidden h-full items-center gap-1 lg:flex"
			aria-label={$_('navigation.primaryAria')}
		>
			{#each primaryNavigation as item (item.href)}
				<Button
					href={item.href}
					variant="ghost"
					class={isActive(item.href) ? 'forge-nav-active' : undefined}
				>
					<item.icon data-icon="inline-start" />{$_(item.label)}
				</Button>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-2">
			{#if $currentSession}
				<output
					class="hidden items-center gap-1 border border-primary/30 bg-card px-2 py-1 font-mono text-xs font-bold text-primary sm:flex"
					aria-label={$_('navigation.money_balance', {
						values: { amount: $currentSession.user.money ?? 0 }
					})}
					title={$_('navigation.money_balance', {
						values: { amount: $currentSession.user.money ?? 0 }
					})}
				>
					<CoinsIcon class="size-3.5" aria-hidden="true" />
					{$currentSession.user.money ?? 0}
				</output>
			{/if}
			<Button href="/boosters" size="sm" class="hidden sm:inline-flex">
				<PackageOpenIcon data-icon="inline-start" />{$_('navigation.openBooster')}
			</Button>
			<Sheet.Root>
				<Sheet.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="outline" size="icon" aria-label={$_('navigation.openMenu')}>
							<MenuIcon />
						</Button>
					{/snippet}
				</Sheet.Trigger>
				<Sheet.Content
					side="right"
					class="w-full border-l border-primary/35 bg-card/98 text-foreground sm:max-w-sm"
				>
					<Sheet.Header class="border-b border-primary/20 pb-4">
						<Sheet.Title class="forge-wordmark text-2xl">{$_('navigation.menuTitle')}</Sheet.Title>
						<Sheet.Description class="text-sm text-muted-foreground"
							>{$_('navigation.menuDescription')}</Sheet.Description
						>
						{#if $currentSession}
							<p class="mt-3 flex items-center gap-2 font-mono text-xs font-bold text-primary">
								<CoinsIcon class="size-4" aria-hidden="true" />
								{$_('navigation.money_balance', {
									values: { amount: $currentSession.user.money ?? 0 }
								})}
							</p>
						{/if}
					</Sheet.Header>
					<nav class="grid gap-1 px-4" aria-label={$_('navigation.mobileAria')}>
						{#each [...primaryNavigation, ...secondaryNavigation] as item (item.href)}
							<Sheet.Close>
								{#snippet child({ props })}
									<Button
										{...props}
										href={item.href}
										variant="ghost"
										class={`w-full justify-start ${isActive(item.href) ? 'forge-nav-active' : ''}`}
									>
										<item.icon data-icon="inline-start" />{$_(item.label)}
									</Button>
								{/snippet}
							</Sheet.Close>
						{/each}
						{#if $currentSession}
							<Button href="/profile" variant="ghost" class="w-full justify-start"
								><UserRoundIcon />{$_('navigation.profile')}</Button
							>
							<Button href="/settings" variant="ghost" class="w-full justify-start"
								><SettingsIcon />{$_('navigation.settings')}</Button
							>
						{:else}
							<Button href="/login" variant="ghost" class="w-full justify-start"
								><LogInIcon />{$_('navigation.login')}</Button
							>
							<Button href="/register" class="mt-2 w-full">{$_('navigation.register')}</Button>
						{/if}
					</nav>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	</div>
</header>

<nav
	class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-primary/25 bg-background/94 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden"
	aria-label={$_('navigation.mobileAria')}
>
	{#each mobileNavigation as item (item.href)}
		<a
			href={resolve(item.href as '/')}
			class="flex min-h-15 flex-col items-center justify-center gap-1 px-1 text-[9px] font-bold tracking-wide text-muted-foreground uppercase"
			class:forge-nav-active={isActive(item.href)}
		>
			<item.icon class="size-5" />
			<span class="max-w-full truncate">{$_(item.label)}</span>
		</a>
	{/each}
	<Sheet.Root>
		<Sheet.Trigger
			class="flex min-h-15 flex-col items-center justify-center gap-1 px-1 text-[9px] font-bold tracking-wide text-muted-foreground uppercase"
		>
			<MenuIcon class="size-5" />{$_('navigation.more')}
		</Sheet.Trigger>
		<Sheet.Content
			side="bottom"
			class="max-h-[82dvh] overflow-y-auto border-t border-primary/40 bg-card text-foreground"
		>
			<Sheet.Header
				><Sheet.Title class="forge-wordmark text-xl">{$_('navigation.menuTitle')}</Sheet.Title
				></Sheet.Header
			>
			{#if $currentSession}
				<p class="px-4 pb-3 font-mono text-xs font-bold text-primary">
					{$_('navigation.money_balance', { values: { amount: $currentSession.user.money ?? 0 } })}
				</p>
			{/if}
			<nav class="grid grid-cols-2 gap-2 px-4 pb-5">
				{#each [...primaryNavigation.slice(2), ...secondaryNavigation] as item (item.href)}
					<Sheet.Close
						>{#snippet child({ props })}<Button
								{...props}
								href={item.href}
								variant="outline"
								class="w-full justify-start"><item.icon />{$_(item.label)}</Button
							>{/snippet}</Sheet.Close
					>
				{/each}
				{#if $currentSession}
					<Button href="/profile" variant="outline" class="w-full justify-start"
						><UserRoundIcon />{$_('navigation.profile')}</Button
					>
					<Button href="/settings" variant="outline" class="w-full justify-start"
						><SettingsIcon />{$_('navigation.settings')}</Button
					>
				{:else}
					<Button href="/login" variant="outline"><LogInIcon />{$_('navigation.login')}</Button>
					<Button href="/register">{$_('navigation.register')}</Button>
				{/if}
			</nav>
		</Sheet.Content>
	</Sheet.Root>
</nav>
