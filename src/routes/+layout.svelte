<script lang="ts">
	import '$lib/i18n';
	import '@fontsource-variable/inter/wght.css';
	import '@fontsource-variable/source-sans-3/wght.css';
	import '@fontsource-variable/source-sans-3/wght-italic.css';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import {
		currentSession,
		hydrateSession,
		markWikiForgeSessionVerified,
		persistSession,
		verifiedWikiForgeSession
	} from '$lib/auth/session';
	import { getCurrentUser } from '$lib/api';
	import { setNsfwFilterSettings } from '$lib/content/nsfw-filter';
	import AppSidebar from '$lib/components/layout/app-sidebar.svelte';
	import ForgeStarfield from '$lib/components/layout/forge-starfield.svelte';
	import MobileTabBar from '$lib/components/layout/mobile-tab-bar.svelte';
	import MobileTopBar from '$lib/components/layout/mobile-top-bar.svelte';
	import NotificationStream from '$lib/components/notifications/notification-stream.svelte';
	import PlayerMoney from '$lib/components/layout/player-money.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { SIDEBAR_COOKIE_NAME } from '$lib/components/ui/sidebar/constants';
	import { Toaster } from '$lib/components/ui/sonner';
	import { _ } from '$lib/i18n';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	import { clearCurrentWelcome, refreshCurrentWelcome } from '$lib/welcome/store';
	import { onMount } from 'svelte';

	let { children } = $props();

	// `ssr = false` : le cookie posé par la sidebar est lisible dès l'initialisation.
	let sidebarOpen = $state(
		!document.cookie.split('; ').some((entry) => entry === `${SIDEBAR_COOKIE_NAME}=false`)
	);
	let handledWelcomeRevision = 0;
	let welcomeLoadedForUserId: string | null = null;

	async function refreshWelcomeForSession() {
		const welcome = await refreshCurrentWelcome();
		const session = $currentSession;
		if (!session) return;
		persistSession(localStorage, {
			...session,
			user: { ...session.user, money: welcome.money, rank: welcome.rank }
		});
	}

	onMount(() => {
		const session = hydrateSession(localStorage);
		if (!session) return;
		void getCurrentUser()
			.then((user) => {
				persistSession(localStorage, { ...session, user });
				markWikiForgeSessionVerified();
				setNsfwFilterSettings({ enabled: user.nsfwEnabled, keywords: user.safeWords });
			})
			.catch(() => setNsfwFilterSettings({}));
	});

	$effect(() => {
		if (!$currentSession || !$verifiedWikiForgeSession) {
			clearCurrentWelcome();
			welcomeLoadedForUserId = null;
			return;
		}
		if (welcomeLoadedForUserId === $currentSession.user.id) return;
		welcomeLoadedForUserId = $currentSession.user.id;
		void refreshWelcomeForSession().catch(() => undefined);
	});

	$effect(() => {
		if (!$currentSession || !$verifiedWikiForgeSession) return;
		const refresh = $realtimeRefresh;
		if (
			refresh.revision === handledWelcomeRevision ||
			(!refreshIncludes(refresh, 'collection') &&
				!refreshIncludes(refresh, 'profile') &&
				!refreshIncludes(refresh, 'trades'))
		)
			return;
		handledWelcomeRevision = refresh.revision;
		void refreshWelcomeForSession().catch(() => undefined);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#071638" />
	<title>{$_('app.title')}</title>
</svelte:head>

<Sidebar.Provider bind:open={sidebarOpen}>
	{#if $currentSession}<AppSidebar />{/if}
	{#if $currentSession}<NotificationStream />{/if}
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
