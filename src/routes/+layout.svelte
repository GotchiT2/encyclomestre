<script lang="ts">
	import '$lib/i18n';
	import '@fontsource-variable/inter/wght.css';
	import '@fontsource-variable/source-sans-3/wght.css';
	import '@fontsource-variable/source-sans-3/wght-italic.css';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { currentSession, hydrateSession, persistSession } from '$lib/auth/session';
	import { getCurrentUser } from '$lib/api';
	import { setNsfwFilterSettings } from '$lib/content/nsfw-filter';
	import AppSidebar from '$lib/components/layout/app-sidebar.svelte';
	import {
		cardVisualAssetUrls,
		preloadCardVisualAssets
	} from '$lib/components/cards/card-visual-assets';
	import ForgeStarfield from '$lib/components/layout/forge-starfield.svelte';
	import MobileTabBar from '$lib/components/layout/mobile-tab-bar.svelte';
	import MobileTopBar from '$lib/components/layout/mobile-top-bar.svelte';
	import PlayerMoney from '$lib/components/layout/player-money.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { SIDEBAR_COOKIE_NAME } from '$lib/components/ui/sidebar/constants';
	import { Toaster } from '$lib/components/ui/sonner';
	import { _ } from '$lib/i18n';
	import { onMount } from 'svelte';

	let { children } = $props();

	// `ssr = false` : le cookie posé par la sidebar est lisible dès l'initialisation.
	let sidebarOpen = $state(
		!document.cookie.split('; ').some((entry) => entry === `${SIDEBAR_COOKIE_NAME}=false`)
	);

	onMount(() => {
		preloadCardVisualAssets();
		const session = hydrateSession(localStorage);
		if (!session) return;
		void getCurrentUser()
			.then((user) => {
				persistSession(localStorage, { ...session, user });
				setNsfwFilterSettings({ enabled: user.nsfwEnabled, keywords: user.safeWords });
			})
			.catch(() => setNsfwFilterSettings({}));
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#071638" />
	<title>{$_('app.title')}</title>
	{#each cardVisualAssetUrls as href (href)}
		<link rel="preload" as="image" {href} />
	{/each}
</svelte:head>

<Sidebar.Provider bind:open={sidebarOpen}>
	{#if $currentSession}<AppSidebar />{/if}
	<MobileTopBar />

	<Sidebar.Inset class="forge-scene bg-transparent">
		<ForgeStarfield />
		<div class="pointer-events-none fixed top-4 right-5 z-30 hidden md:block lg:right-8">
			<div class="pointer-events-auto"><PlayerMoney /></div>
		</div>
		<div class="mx-auto w-full max-w-screen-2xl px-4 pt-20 pb-28 sm:px-5 md:pt-8 md:pb-10 lg:px-8">
			{@render children()}
		</div>
	</Sidebar.Inset>

	{#if $currentSession}<MobileTabBar />{/if}
</Sidebar.Provider>

<Toaster richColors />
