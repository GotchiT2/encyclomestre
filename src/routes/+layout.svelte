<script lang="ts">
	import '$lib/i18n';
	import { resolve } from '$app/paths';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { currentSession, hydrateSession } from '$lib/auth/session';
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
	import { onMount } from 'svelte';

	let { children } = $props();

	const navigation = [
		{ href: '/', label: 'navigation.home', icon: GalleryVerticalEndIcon },
		{ href: '/cards', label: 'navigation.cards', icon: BookOpenIcon },
		{ href: '/collection', label: 'navigation.collection', icon: LibraryBigIcon },
		{ href: '/friends', label: 'navigation.friends', icon: UsersIcon },
		{ href: '/messages', label: 'navigation.messages', icon: MessageCircleIcon },
		{ href: '/market', label: 'navigation.market', icon: StoreIcon },
		{ href: '/wishlists', label: 'navigation.wishlist', icon: HeartIcon },
		{ href: '/trades', label: 'navigation.trades', icon: HandshakeIcon },
		{ href: '/boosters', label: 'navigation.boosters', icon: PackageOpenIcon }
	];

	onMount(() => hydrateSession(localStorage));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#080A09" />
	<title>{$_('app.title')}</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<header class="border-b border-primary/30 bg-background/90 backdrop-blur-sm lg:hidden">
		<div
			class="mx-auto flex min-h-20 max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10"
		>
			<a
				href={resolve('/')}
				class="group flex items-center gap-3"
				aria-label={$_('navigation.home')}
			>
				<span class="grid size-10 place-items-center border border-primary/60 bg-card text-primary"
					><GalleryVerticalEndIcon /></span
				>
				<span class="flex flex-col">
					<span class="font-serif text-lg font-black uppercase tracking-tight text-foreground"
						>{$_('navigation.brand')}</span
					>
					<span class="font-mono text-[9px] uppercase tracking-[0.24em] text-primary"
						>{$_('navigation.registry')}</span
					>
				</span>
			</a>

			<nav class="hidden items-center gap-1 md:flex" aria-label={$_('navigation.primaryAria')}>
				{#each navigation as item (item.href)}
					<Button href={item.href} variant="ghost" size="sm"
						><item.icon data-icon="inline-start" />{$_(item.label)}</Button
					>
				{/each}
				{#if $currentSession}<Button href="/profile" variant="ghost" size="sm"
						><UserRoundIcon data-icon="inline-start" />{$_('navigation.profile')}</Button
					><Button href="/settings" variant="ghost" size="sm"
						><SettingsIcon data-icon="inline-start" />{$_('navigation.settings')}</Button
					>{/if}
			</nav>

			<div class="hidden items-center gap-2 md:flex">
				{#if !$currentSession}<Button href="/login" variant="ghost" size="sm"
						>{$_('navigation.login')}</Button
					>
					<Button href="/register" size="sm">{$_('navigation.register')}</Button>{/if}
			</div>

			<Sheet.Root>
				<Sheet.Trigger class="md:hidden">
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							size="icon-sm"
							aria-label={$_('navigation.openMenu')}><MenuIcon /></Button
						>
					{/snippet}
				</Sheet.Trigger>
				<Sheet.Content side="right" class="w-80 border-l border-primary/40 bg-card text-foreground">
					<Sheet.Header>
						<Sheet.Title class="font-serif font-black uppercase tracking-tight"
							>{$_('navigation.menuTitle')}</Sheet.Title
						>
						<Sheet.Description class="font-serif italic text-muted-foreground"
							>{$_('navigation.menuDescription')}</Sheet.Description
						>
					</Sheet.Header>
					<nav class="flex flex-col gap-1 px-4" aria-label={$_('navigation.mobileAria')}>
						{#each navigation as item (item.href)}
							<Sheet.Close>
								{#snippet child({ props })}
									<Button {...props} href={item.href} variant="ghost" class="w-full justify-start"
										><item.icon data-icon="inline-start" />{$_(item.label)}</Button
									>
								{/snippet}
							</Sheet.Close>
						{/each}
						{#if $currentSession}<Sheet.Close>
								{#snippet child({ props })}
									<Button {...props} href="/profile" variant="ghost" class="w-full justify-start"
										><UserRoundIcon data-icon="inline-start" />{$_('navigation.profile')}</Button
									>
								{/snippet}
							</Sheet.Close><Sheet.Close>
								{#snippet child({ props })}
									<Button {...props} href="/settings" variant="ghost" class="w-full justify-start"
										><SettingsIcon data-icon="inline-start" />{$_('navigation.settings')}</Button
									>
								{/snippet}
							</Sheet.Close>{/if}
					</nav>
					<Sheet.Footer class="flex-col gap-2 sm:flex-col">
						{#if !$currentSession}<Button href="/login" variant="outline" class="w-full"
								><LogInIcon data-icon="inline-start" />{$_('navigation.login')}</Button
							><Button href="/register" class="w-full">{$_('navigation.register')}</Button>{/if}
					</Sheet.Footer>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	</header>

	<aside
		class="fixed inset-y-0 left-0 hidden w-64 border-r border-primary/30 bg-background p-5 lg:flex lg:flex-col"
	>
		<a href={resolve('/')} class="flex items-center gap-3"
			><span class="grid size-10 place-items-center border border-primary/60 bg-card text-primary"
				><GalleryVerticalEndIcon /></span
			><span
				><span class="block font-serif text-lg font-black uppercase">{$_('navigation.brand')}</span
				><span class="font-mono text-[9px] uppercase tracking-widest text-primary"
					>{$_('navigation.registry')}</span
				></span
			></a
		>
		<nav class="mt-8 flex flex-col gap-1" aria-label={$_('navigation.primaryAria')}>
			{#each navigation as item (item.href)}<Button
					href={item.href}
					variant="ghost"
					class="w-full justify-start"
					><item.icon data-icon="inline-start" />{$_(item.label)}</Button
				>{/each}{#if $currentSession}<Button
					href="/profile"
					variant="ghost"
					class="w-full justify-start"
					><UserRoundIcon data-icon="inline-start" />{$_('navigation.profile')}</Button
				><Button href="/settings" variant="ghost" class="w-full justify-start"
					><SettingsIcon data-icon="inline-start" />{$_('navigation.settings')}</Button
				>{/if}
		</nav>
	</aside>
	<main class="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:ml-64 lg:max-w-none lg:px-10">
		{@render children()}
	</main>
</div>
