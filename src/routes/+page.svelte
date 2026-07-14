<script lang="ts">
	import { currentSession } from '$lib/auth/session';
	import GuestLanding from '$lib/components/landing/guest-landing.svelte';
	import PlayerDashboard from '$lib/components/landing/player-dashboard.svelte';
	import { _ } from '$lib/i18n';
</script>

<svelte:head><title>{$_('app.title')}</title></svelte:head>

{#if $currentSession}
	<PlayerDashboard username={$currentSession.user.username} />
{:else}
	<GuestLanding />
{/if}
