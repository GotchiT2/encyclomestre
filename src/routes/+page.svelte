<script lang="ts">
	import { currentSession } from '$lib/auth/session';
	import { getWikiForgePublicPages, toPublicPage } from '$lib/api';
	import GuestLanding from '$lib/components/landing/guest-landing.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { _ } from '$lib/i18n';
	import type { CardRecord } from '$lib/types';

	$effect(() => {
		if ($currentSession) void goto(resolve('/collection'), { replaceState: true });
	});
	let showcaseCard = $state<CardRecord | null>(null);
	let hasLoadedShowcase = $state(false);

	$effect(() => {
		if ($currentSession || hasLoadedShowcase) return;
		hasLoadedShowcase = true;
		void getWikiForgePublicPages({ page: 0 })
			.then((result) => (showcaseCard = toPublicPage(result).items[0] ?? null))
			.catch(() => undefined);
	});
</script>

<svelte:head><title>{$_('app.title')}</title></svelte:head>

{#if !$currentSession}
	<GuestLanding {showcaseCard} />
{/if}
