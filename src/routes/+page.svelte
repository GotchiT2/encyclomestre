<script lang="ts">
	import { currentSession } from '$lib/auth/session';
	import { getCards, getWikiForgeWelcome } from '$lib/api';
	import GuestLanding from '$lib/components/landing/guest-landing.svelte';
	import PlayerDashboard from '$lib/components/landing/player-dashboard.svelte';
	import { _ } from '$lib/i18n';
	import type { CardRecord, DashboardData } from '$lib/types';

	let dashboard = $state<DashboardData | null>(null);
	let loadedDashboardFor = $state<string | null>(null);
	let showcaseCard = $state<CardRecord | null>(null);
	let hasLoadedShowcase = $state(false);

	$effect(() => {
		const session = $currentSession;
		if (!session || loadedDashboardFor === session.user.id) return;
		loadedDashboardFor = session.user.id;
		void getWikiForgeWelcome().then((result) => (dashboard = result));
	});

	$effect(() => {
		if ($currentSession || hasLoadedShowcase) return;
		hasLoadedShowcase = true;
		void getCards({ page: 1, pageSize: 1 }).then(
			(result) => (showcaseCard = result.items[0] ?? null)
		);
	});
</script>

<svelte:head><title>{$_('app.title')}</title></svelte:head>

{#if $currentSession}
	<PlayerDashboard username={$currentSession.user.username} {dashboard} />
{:else}
	<GuestLanding {showcaseCard} />
{/if}
