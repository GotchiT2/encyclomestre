<script lang="ts">
	import { currentSession } from '$lib/auth/session';
	import { getWikiForgePublicPages, toPublicPage } from '$lib/api';
	import GuestLanding from '$lib/components/landing/guest-landing.svelte';
	import PlayerDashboard from '$lib/components/landing/player-dashboard.svelte';
	import { _ } from '$lib/i18n';
	import type { CardRecord } from '$lib/types';
	import { currentWelcome } from '$lib/welcome/store';

	let showcaseCard = $state<CardRecord | null>(null);
	let hasLoadedShowcase = $state(false);

	$effect(() => {
		if ($currentSession || hasLoadedShowcase) return;
		hasLoadedShowcase = true;
		void getWikiForgePublicPages({ page: 0 }).then((result) =>
			(showcaseCard = toPublicPage(result).items[0] ?? null)
		);
	});
</script>

<svelte:head><title>{$_('app.title')}</title></svelte:head>

{#if $currentSession}
	<PlayerDashboard username={$currentSession.user.username} dashboard={$currentWelcome} />
{:else}
	<GuestLanding {showcaseCard} />
{/if}
