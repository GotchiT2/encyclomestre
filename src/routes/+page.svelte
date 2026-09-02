<script lang="ts">
	import { currentSession } from '$lib/auth/session';
	import { getCards } from '$lib/api';
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
		void getCards({ page: 1, pageSize: 1 }).then(
			(result) => (showcaseCard = result.items[0] ?? null)
		);
	});
</script>

<svelte:head><title>{$_('app.title')}</title></svelte:head>

{#if $currentSession}
	<PlayerDashboard username={$currentSession.user.username} dashboard={$currentWelcome} />
{:else}
	<GuestLanding {showcaseCard} />
{/if}
