<script lang="ts">
	import ProfileWorkspace from '$lib/components/profile/profile-workspace.svelte';
	import { currentSession } from '$lib/auth/session';
	import { _ } from '$lib/i18n';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

{#await Promise.all([data.showcase, data.collection, data.tags, data.sales])}
	<p class="forge-label text-primary">{$_('common.loading')}</p>
{:then [showcase, collection, tags, sales]}
	{#if $currentSession}
		<ProfileWorkspace
			user={$currentSession.user}
			initialShowcase={showcase}
			initialCollection={collection}
			{tags}
			initialSales={sales}
		/>
	{/if}
{:catch}
	<p class="forge-panel-flat p-4 text-destructive">{$_('profile.load_error')}</p>
{/await}
