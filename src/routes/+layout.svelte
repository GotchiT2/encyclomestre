<script lang="ts">
	import '$lib/i18n';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { hydrateSession } from '$lib/auth/session';
	import { getCurrentUser } from '$lib/api';
	import { setNsfwFilterSettings } from '$lib/content/nsfw-filter';
	import AppNavigation from '$lib/components/layout/app-navigation.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { _ } from '$lib/i18n';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		const session = hydrateSession(localStorage);
		if (!session) return;
		void getCurrentUser()
			.then((user) =>
				setNsfwFilterSettings({ enabled: user.nsfwEnabled, keywords: user.safeWords })
			)
			.catch(() => setNsfwFilterSettings({}));
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#050a12" />
	<title>{$_('app.title')}</title>
</svelte:head>

<div class="min-h-screen bg-transparent">
	<AppNavigation />
	<main
		class="forge-scene mx-auto min-h-screen max-w-screen-2xl px-4 pt-24 pb-20 sm:px-5 lg:px-8 lg:pb-10"
	>
		{@render children()}
	</main>
</div>

<Toaster richColors />
