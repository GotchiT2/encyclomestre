<script lang="ts">
	import '$lib/i18n';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { hydrateSession } from '$lib/auth/session';
	import AppNavigation from '$lib/components/layout/app-navigation.svelte';
	import { _ } from '$lib/i18n';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => hydrateSession(localStorage));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#050a12" />
	<title>{$_('app.title')}</title>
</svelte:head>

<div class="min-h-screen bg-transparent">
	<AppNavigation />
	<main
		class="forge-scene mx-auto min-h-screen max-w-screen-2xl px-4 pt-26 pb-24 sm:px-6 lg:px-10 lg:pb-12"
	>
		{@render children()}
	</main>
</div>
