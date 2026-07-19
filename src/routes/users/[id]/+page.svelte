<script lang="ts">
	import PublicProfileView from '$lib/components/profile/public-profile-view.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { _ } from '$lib/i18n';
	import type { PageData } from './$types';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';

	let { data }: { data: PageData } = $props();
</script>

{#await Promise.all( [data.user, data.collection, data.catalogue, data.settings, data.summary, data.sales] )}
	<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
		{$_('friends.loading')}
	</p>
{:then [user, collection, catalogue, settings, summary, sales]}
	<PublicProfileView
		{user}
		{collection}
		catalogue={catalogue.items}
		{settings}
		{summary}
		{sales}
		tags={summary.publicTags}
		assignments={{}}
	/>
{:catch}
	<Alert.Root variant="destructive">
		<CircleAlertIcon />
		<Alert.Title>{$_('friends.error')}</Alert.Title>
	</Alert.Root>
{/await}
