<script lang="ts">
	import { resolve } from '$app/paths';
	import { getGuildMembers, getGuildObjective, getMyGuild } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import ForgePanel from '$lib/components/layout/forge-panel.svelte';
	import EmptyState from '$lib/components/layout/empty-state.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { _ } from '$lib/i18n';
	import type { GuildMember, GuildObjective, GuildSummary } from '$lib/types';
	import { onMount } from 'svelte';

	let guild = $state<GuildSummary | null>(null);
	let members = $state<GuildMember[]>([]);
	let objective = $state<GuildObjective | null>(null);
	let loading = $state(true);

	onMount(async () => {
		const current = await getMyGuild();
		if ('id' in current && current.id) {
			guild = current as GuildSummary;
			[members, objective] = await Promise.all([
				getGuildMembers(current.id),
				getGuildObjective(current.id)
			]);
		}
		loading = false;
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
	{:else if guild && objective}
		<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
			<ForgePanel class="p-6">
				<p class="forge-label">{$_('guild.objective')}</p>
				<h2 class="mt-3 text-3xl font-bold">{objective.title}</h2>
				<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
					{$_('guild.objective_description')}
				</p>
				<div class="mt-6 h-3 border border-primary/30 bg-background p-0.5">
					<div
						class="h-full bg-gradient-to-r from-[var(--energy)] to-primary shadow-[0_0_18px_rgb(25_167_170_/_35%)]"
						style={`width:${Math.max(0, Math.min(100, objective.progress))}%`}
					></div>
				</div>
				<p class="forge-label mt-3">
					{$_('guild.progress_value', { values: { progress: objective.progress } })}
				</p>
				<Button href="/messages" variant="outline" class="mt-5">{$_('guild.open_channel')}</Button>
			</ForgePanel>
			<ForgePanel as="div" class="p-4">
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
		</div>
	{:else}
		<EmptyState title={$_('guild.empty')} />
	{/if}
</section>
