<script lang="ts">
	import { currentSession } from '$lib/auth/session';
	import PlayerDashboard from '$lib/components/landing/player-dashboard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import { currentWelcome, welcomeError, refreshCurrentWelcome } from '$lib/welcome/store';
</script>

<svelte:head><title>{$_('arcade.recap')} · {$_('app.title')}</title></svelte:head>
{#if $currentSession}
	{#if $welcomeError}<p role="alert">{$_('plan.loadError')}</p>
		<Button onclick={() => void refreshCurrentWelcome().catch(() => undefined)}
			>{$_('completion.retry')}</Button
		>
	{:else if !$currentWelcome}<p role="status">{$_('completion.loading')}</p>{/if}
	<PlayerDashboard username={$currentSession.user.username} dashboard={$currentWelcome} />
{/if}
