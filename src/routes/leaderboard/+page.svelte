<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import { getLeaderboard, type LeaderboardPeriod } from '$lib/api';
	import { currentSession } from '$lib/auth/session';
	import { _ } from '$lib/i18n';
	import type { Leaderboard } from '$lib/types';

	const periods: LeaderboardPeriod[] = ['global', 'daily', 'weekly'];
	let active = $state<LeaderboardPeriod>('global');
	let cache = $state<Record<string, Leaderboard>>({});
	let loading = $state(false);
	let failed = $state(false);

	$effect(() => {
		void load(active);
	});
	const cacheKey = $derived(active);
	async function load(period: LeaderboardPeriod, force = false) {
		const key = period;
		const cached = cache[key];
		if (
			cached &&
			!force &&
			(!cached.refreshAt || new Date(cached.refreshAt).getTime() > Date.now())
		)
			return;
		loading = true;
		failed = false;
		try {
			cache[key] = await getLeaderboard(period);
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	}
	const board = $derived(cache[cacheKey]);
	const meInTop = $derived(
		board?.top.some((entry) => entry.id === $currentSession?.user.id) ?? false
	);
</script>

<svelte:head><title>{$_('leaderboard.title')}</title></svelte:head>
<section class="flex flex-col gap-6 pb-12">
	<PageHeader
		eyebrow={$_('leaderboard.eyebrow')}
		title={$_('leaderboard.title')}
		description={$_('leaderboard.description')}
	/>
	<div
		class="grid grid-cols-3 border border-primary/30 bg-card p-1"
		role="tablist"
		aria-label={$_('leaderboard.periods')}
	>
		{#each periods as period (period)}<Button
				variant={active === period ? 'default' : 'ghost'}
				role="tab"
				aria-selected={active === period}
				onclick={() => (active = period)}>{$_(`leaderboard.${period}`)}</Button
			>{/each}
	</div>
	{#if loading && !board}<p class="forge-label text-primary">
			{$_('common.loading')}
		</p>{:else if failed && !board}<div class="forge-panel-flat p-4">
			<p class="text-destructive">{$_('leaderboard.error')}</p>
			<Button class="mt-3" onclick={() => load(active, true)}>{$_('common.retry')}</Button>
		</div>{:else if board}
		<div class="overflow-hidden border border-primary/25 bg-card">
			{#each board.top as entry (entry.id)}<a
					href={resolve('/users/[id]', { id: entry.id })}
					class="grid grid-cols-[3rem_2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-primary/15 px-3 py-2 transition-colors hover:bg-primary/10"
					class:bg-primary-15={entry.id === $currentSession?.user.id}
					><strong class="text-center font-heading text-xl text-primary">{entry.rank}</strong
					>{#if entry.image}<img
							src={entry.image}
							alt=""
							class="size-10 rounded-full object-cover"
						/>{:else}<div
							class="grid size-10 place-items-center rounded-full border border-primary/30"
						>
							{entry.name[0]}
						</div>{/if}<span class="truncate font-bold">{entry.name}</span><span
						class="forge-label whitespace-nowrap"
						>{$_('leaderboard.cards', { values: { count: entry.nbCards } })}</span
					></a
				>{/each}
		</div>
		{#if board.computedAt && board.refreshAt}
			<p class="forge-label text-muted-foreground">
				{$_('leaderboard.computed_at', {
					values: {
						date: new Intl.DateTimeFormat('fr-FR', {
							dateStyle: 'short',
							timeStyle: 'short'
						}).format(new Date(board.computedAt))
					}
				})}
				· {$_('leaderboard.refresh_at', {
					values: {
						date: new Intl.DateTimeFormat('fr-FR', { timeStyle: 'short' }).format(
							new Date(board.refreshAt)
						)
					}
				})}
			</p>
		{/if}
		{#if !meInTop && board.around.length}<section>
				<h2 class="forge-label mb-2 text-primary">{$_('leaderboard.your_position')}</h2>
				<div class="border border-energy/35 bg-card">
					{#each board.around as entry (entry.id)}<a
							href={resolve('/users/[id]', { id: entry.id })}
							class="grid grid-cols-[3rem_2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-primary/15 px-3 py-2"
							class:bg-primary-15={entry.id === $currentSession?.user.id}
							><strong class="text-center font-heading text-xl text-primary">{entry.rank}</strong
							>{#if entry.image}<img
									src={entry.image}
									alt=""
									class="size-10 rounded-full object-cover"
								/>{:else}<div class="size-10 rounded-full border border-primary/30"></div>{/if}<span
								class="truncate font-bold">{entry.name}</span
							><span class="forge-label whitespace-nowrap">{entry.nbCards}</span></a
						>{/each}
				</div>
			</section>{:else if !meInTop && active !== 'global'}<p
				class="forge-panel-flat p-4 text-muted-foreground"
			>
				{$_('leaderboard.unranked')}
			</p>{/if}
	{/if}
</section>
