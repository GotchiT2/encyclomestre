<script lang="ts">
	import ProfileWorkspace from '$lib/components/profile/profile-workspace.svelte';
	import { _ } from '$lib/i18n';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

{#await Promise.all([data.user, data.showcase, data.collection, data.tags, data.sales])}
	<p class="forge-label text-primary">{$_('common.loading')}</p>
{:then [user, showcase, collection, tags, sales]}
	<ProfileWorkspace
		{user}
		initialShowcase={showcase}
		initialCollection={collection}
		{tags}
		initialSales={sales}
	/>
{:catch}
	<p class="forge-panel-flat p-4 text-destructive">{$_('profile.load_error')}</p>
{/await}
