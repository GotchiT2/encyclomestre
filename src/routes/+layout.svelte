<script lang="ts">
	import IconTooltips from '$lib/components/layout/icon-tooltips.svelte';
	import '$lib/i18n';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
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
	<link rel="icon" type="image/svg+xml" href={favicon} />
	<link rel="icon" type="image/png" sizes="32x32" href="/brand/v1/favicon-32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/brand/v1/favicon-16.png" />
	<link rel="apple-touch-icon" sizes="180x180" href="/brand/v1/icon-180.png" />
	<link rel="mask-icon" href="/brand/v1/pinned-tab.svg" color="#E8EF42" />
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="theme-color" content="#171918" />
	<meta name="application-name" content={$_('navigation.brand')} />
	<meta name="apple-mobile-web-app-title" content={$_('navigation.brand')} />
	<meta name="description" content={$_('landing.manifest')} />
	<meta property="og:site_name" content={$_('navigation.brand')} />
	<meta property="og:title" content={$_('app.title')} />
	<meta property="og:description" content={$_('landing.manifest')} />
	<meta property="og:image" content={new URL('/brand/v1/social-card.png', page.url).href} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={$_('navigation.brand')} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={new URL('/brand/v1/social-card.png', page.url).href} />
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
<IconTooltips />
<Toaster richColors />
