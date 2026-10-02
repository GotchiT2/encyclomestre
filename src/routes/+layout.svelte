<script lang="ts">
	import '$lib/i18n';
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
	import MobileTabBar from '$lib/components/layout/mobile-tab-bar.svelte';
	import MobileTopBar from '$lib/components/layout/mobile-top-bar.svelte';
	import NotificationStream from '$lib/components/notifications/notification-stream.svelte';
	import AuctionSession from '$lib/components/market/auction-session.svelte';
	import CardDetailHost from '$lib/components/cards/card-detail-host.svelte';
	import GlobalBanners from '$lib/components/layout/global-banners.svelte';
	import { replaceBanners } from '$lib/banners/store';
	import { Toaster } from '$lib/components/ui/sonner';
	import { _ } from '$lib/i18n';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	import { clearCurrentWelcome, refreshCurrentWelcome } from '$lib/welcome/store';
	import { onMount } from 'svelte';
	import { hydrateArcadePreferences } from '$lib/arcade/preferences';
	import { clearOpeningReceipts } from '$lib/arcade/opening-receipt';
	import { invalidateArticleContexts } from '$lib/arcade/article-context';

	let { children } = $props();

	let handledWelcomeRevision = 0;
	let lastReceiptAccount: string | null = null;
	let contextRevision = 0;
	$effect(() => {
		const account = $currentSession?.user.id ?? null;
		if (lastReceiptAccount && lastReceiptAccount !== account) clearOpeningReceipts(sessionStorage);
		lastReceiptAccount = account;
	});
	$effect(() => {
		const refresh = $realtimeRefresh;
		if (refresh.revision === contextRevision) return;
		contextRevision = refresh.revision;
		if (refreshIncludes(refresh, 'collection')) invalidateArticleContexts();
	});
	let welcomeLoadedForUserId: string | null = null;

	async function refreshWelcomeForSession(force = false) {
		const account = $currentSession?.user.id;
		const welcome = await refreshCurrentWelcome(force);
		const session = $currentSession;
		if (!session || session.user.id !== account) return;
		persistSession(localStorage, {
			...session,
			user: { ...session.user, money: welcome.money, rank: welcome.rank }
		});
	}

	onMount(() => {
		hydrateArcadePreferences(localStorage);
		const session = hydrateSession(localStorage);
		if (!session) return;
		void getCurrentUser()
			.then((user) => {
				replaceBanners(user.banners);
				persistSession(localStorage, { ...session, user });
				markWikiForgeSessionVerified();
				setNsfwFilterSettings({ enabled: user.nsfwEnabled, keywords: user.safeWords });
			})
			.catch(() => setNsfwFilterSettings({}));
	});

	$effect(() => {
		if (!$currentSession || !$verifiedWikiForgeSession) {
			replaceBanners([]);
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
		void refreshWelcomeForSession(true).catch(() => undefined);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#171918" />
	<title>{$_('app.title')}</title>
</svelte:head>

<div class="app-frame">
	<AuctionSession />
	{#if $currentSession}<NotificationStream />{/if}

	<main class="forge-scene min-w-0 bg-transparent">
		<MobileTopBar />
		<GlobalBanners />
		<div class="arcade-page">
			{@render children()}
		</div>
	</main>

	{#if $currentSession}<MobileTabBar />{/if}
</div>

<CardDetailHost />
<Toaster richColors />
