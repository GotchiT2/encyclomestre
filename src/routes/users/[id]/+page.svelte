<script lang="ts">
	import PublicProfileView from '$lib/components/profile/public-profile-view.svelte';
	import { mockCollectionTagAssignments, mockCollectionTags } from '$lib/api/mocks/collection-tags';
	import { _ } from '$lib/i18n';
	import type { PageData } from './$types';

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
		tags={mockCollectionTags}
		assignments={mockCollectionTagAssignments}
	/>
{:catch}
	<p class="border border-destructive/40 bg-destructive/10 p-4 font-serif italic text-destructive">
		{$_('friends.error')}
	</p>
{/await}
