<script lang="ts">
	import { resolve } from '$app/paths';
	import { getGuildMembers, getMyGuild } from '$lib/api';
	import ForgePanel from '$lib/components/layout/forge-panel.svelte';
	import EmptyState from '$lib/components/layout/empty-state.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { _ } from '$lib/i18n';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	import type { GuildMember, GuildSummary } from '$lib/types';
	import { onMount } from 'svelte';

	let guild = $state<GuildSummary | null>(null);
	let members = $state<GuildMember[]>([]);
	let loading = $state(true);
	let ready = $state(false);
	let handledRealtimeRevision = 0;

	async function load() {
		loading = true;
		try {
			const current = await getMyGuild();
			guild = current;
			members = current ? await getGuildMembers(current.id) : [];
		} finally {
			loading = false;
		}
	}

	onMount(() => void load().finally(() => (ready = true)));

	$effect(() => {
		const refresh = $realtimeRefresh;
		if (
			!ready ||
			refresh.revision === handledRealtimeRevision ||
			!refreshIncludes(refresh, 'guild')
		)
			return;
		handledRealtimeRevision = refresh.revision;
		void load();
	});
</script>

<section class="flex flex-col gap-6 pb-12">
	<PageHeader
		eyebrow={$_('guild.eyebrow')}
		title={guild?.name ?? $_('guild.title')}
		description={guild?.description ?? $_('guild.description')}
	/>
	{#if loading}
		<p class="forge-label">{$_('guild.loading')}</p>
	{:else if guild}
		<ForgePanel as="div" class="max-w-xl p-4">
			<h2 class="text-xl font-bold">{$_('guild.members')}</h2>
			<ul class="mt-4 divide-y divide-primary/15">
				{#each members as member (member.userId)}
					<li class="flex items-center justify-between gap-3 py-3">
						<a href={resolve('/users/[id]', { id: member.userId })} class="font-bold"
							>@{member.username}</a
						>
						<span class="forge-label text-[9px]">{member.role}</span>
					</li>
				{/each}
			</ul>
		</ForgePanel>
	{:else}
		<EmptyState title={$_('guild.empty')} />
	{/if}
</section>
