<script lang="ts">
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import { untrack } from 'svelte';
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
	let sequence = 0;
	$effect(() => {
		const refreshAt = cache[active]?.refreshAt;
		if (!refreshAt) return;
		const delay = Date.parse(refreshAt) - Date.now();
		if (!Number.isFinite(delay) || delay <= 0) return;
		const timer = setTimeout(() => void load(active, true), Math.min(delay + 50, 2147483647));
		return () => clearTimeout(timer);
	});

	$effect(() => {
		const period = active;
		untrack(() => void load(period));
	});
	const cacheKey = $derived(active);
	async function load(period: LeaderboardPeriod, force = false) {
		const request = ++sequence;
		const key = period;
		const cached = cache[key];
		if (
			cached &&
			!force &&
			(!cached.refreshAt || new Date(cached.refreshAt).getTime() > Date.now())
		) {
			loading = false;
			failed = false;
			return;
		}
		loading = true;
		failed = false;
		try {
			cache[key] = await getLeaderboard(period);
		} catch {
			if (request === sequence) failed = true;
		} finally {
			if (request === sequence) loading = false;
		}
	}
	const board = $derived(cache[cacheKey]);
	const ownPosition = $derived(
		[...(board?.top ?? []), ...(board?.around ?? [])].find(
			(entry) => entry.id === $currentSession?.user.id
		)
	);
	const meInTop = $derived(
		board?.top.some((entry) => entry.id === $currentSession?.user.id) ?? false
	);
</script>

<svelte:head><title>{$_('leaderboard.title')}</title></svelte:head>
<section class="flex flex-col gap-6 pb-12">
	<PageHeader
		eyebrow={$_('leaderboard.eyebrow')}
		title={$_('leaderboard.title')}
		description={$_('plan.leaderboard.criteria')}
	/>
	<Button variant="outline" disabled={loading} onclick={() => void load(active, true)}
		>{$_('completion.refresh')}</Button
	>
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
		<section class="personal-rank" aria-label={$_('leaderboard.your_position')}>
			<p>{$_('leaderboard.your_position')}</p>
			{#if ownPosition}<strong>#{ownPosition.rank}</strong><span
					>{$_('leaderboard.cards', { values: { count: ownPosition.nbCards } })}</span
				>{:else}<span>{$_('leaderboard.unranked')}</span>{/if}
		</section>
		<div class="ranking-leaders">
			{#each board.top.slice(0, 3) as entry (entry.id)}<a
					href={resolve('/users/[id]', { id: entry.id })}
				>
					<span class="leader-number">{String(entry.rank).padStart(2, '0')}</span><UserAvatar
						image={entry.image}
						crop={entry.imageCrop}
						name={entry.name}
					/>
					<strong>{entry.name}</strong><span
						>{$_('leaderboard.cards', { values: { count: entry.nbCards } })}</span
					>
				</a>{/each}
		</div>
		<div class="overflow-hidden border border-primary/25 bg-card">
			{#each board.top.slice(3) as entry (entry.id)}<a
					href={resolve('/users/[id]', { id: entry.id })}
					class="min-h-16 grid grid-cols-[2rem_2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-primary/15 px-3 py-2 transition-colors hover:bg-primary/10"
					class:bg-primary-15={entry.id === $currentSession?.user.id}
					><strong class="text-center font-heading text-xl text-primary">{entry.rank}</strong
					><UserAvatar image={entry.image} crop={entry.imageCrop} name={entry.name} /><span
						class="truncate font-bold">{entry.name}</span
					><span class="forge-label whitespace-nowrap"
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
							class="min-h-16 grid grid-cols-[2rem_2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-primary/15 px-3 py-2"
							class:bg-primary-15={entry.id === $currentSession?.user.id}
							><strong class="text-center font-heading text-xl text-primary">{entry.rank}</strong
							><UserAvatar image={entry.image} crop={entry.imageCrop} name={entry.name} /><span
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

<style>
	.personal-rank {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
		border-left: 3px solid var(--primary);
		background: var(--card);
		padding: 12px;
	}
	.personal-rank strong {
		font-size: 32px;
		font-variant-numeric: tabular-nums;
		color: var(--primary);
	}
	.ranking-leaders {
		display: grid;
		gap: 8px;
	}
	.ranking-leaders a {
		display: grid;
		grid-template-columns: 48px 40px minmax(0, 1fr) auto;
		gap: 12px;
		align-items: center;
		border-bottom: 1px solid var(--border);
		padding: 12px;
	}
	.ranking-leaders strong {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ranking-leaders a > span:last-child {
		font-size: 12px;
	}
	.leader-number {
		font-size: 32px;
		font-weight: 800;
		color: var(--primary);
	}
	@media (min-width: 1024px) {
		.ranking-leaders {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 16px;
		}
		.ranking-leaders a {
			grid-template-columns: 40px minmax(0, 1fr);
			background: var(--card);
		}
		.ranking-leaders strong,
		.ranking-leaders a > span:last-child {
			grid-column: 2;
		}
	}
</style>
