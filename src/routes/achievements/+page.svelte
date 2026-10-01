<script lang="ts">
	import {
		realtimeRefresh,
		refreshIncludes,
		publishRealtimeRefresh
	} from '$lib/realtime/resource-refresh';
	import { onMount } from 'svelte';
	import { claimAllAchievements } from '$lib/api/achievements';
	import { _ } from '$lib/i18n';
	import { claimAchievement, getBoosters, getCurrentUser } from '$lib/api';
	import { currentSession, persistSession } from '$lib/auth/session';
	import { achievementAvailability, refreshAchievementSummary } from '$lib/achievements/store';
	import AchievementList from '$lib/components/achievements/achievement-list.svelte';
	import EmptyState from '$lib/components/layout/empty-state.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import { wikiForgeApiErrorCode } from '$lib/api/wikiforge-contract';
	import type { Achievement } from '$lib/types';

	let achievements = $state<Achievement[]>([]);
	let loading = $state(true);
	let failed = $state(false);
	let claimingCode = $state<string | null>(null);
	let claimError = $state<string | null>(null);

	async function load(force = false) {
		loading = true;
		failed = false;
		try {
			achievements = await refreshAchievementSummary(force);
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	}

	async function claim(achievement?: Achievement) {
		if (claimingCode) return;
		claimingCode = achievement?.code ?? '*';
		claimError = null;
		try {
			if (achievement) await claimAchievement(achievement.code);
			else await claimAllAchievements();
		} catch (error) {
			if (wikiForgeApiErrorCode(error) !== 'ACHIEVEMENT_CONFLICT') {
				claimError = 'error';
			}
		} finally {
			try {
				const [user, , refreshedAchievements] = await Promise.all([
					getCurrentUser(),
					getBoosters(),
					refreshAchievementSummary(true)
				]);
				const session = $currentSession;
				if (session) persistSession(localStorage, { ...session, user });
				achievements = refreshedAchievements;
				publishRealtimeRefresh(['profile', 'boosters']);
			} catch {
				claimError ??= 'refresh_error';
				failed = true;
			} finally {
				claimingCode = null;
			}
		}
	}

	onMount(() => void load());
	let revision = 0;
	$effect(() => {
		const refresh = $realtimeRefresh;
		if (revision === refresh.revision || !refreshIncludes(refresh, 'achievements')) return;
		revision = refresh.revision;
		void load(true);
	});
</script>

<section class="flex flex-col gap-6 pb-12">
	<PageHeader
		eyebrow={$_('achievements.eyebrow')}
		title={$_('achievements.title')}
		description={$_('achievements.description')}
	/>
	{#if loading}
		<p class="forge-label">{$_('achievements.loading')}</p>
	{:else if $achievementAvailability === 'unavailable'}
		<EmptyState
			title={$_('achievements.unavailable_title')}
			description={$_('achievements.unavailable_description')}
		/>
	{:else if failed}
		<div class="forge-panel-flat flex items-center justify-between gap-3 p-4">
			<p class="text-destructive">{$_('achievements.error')}</p>
			<Button variant="outline" onclick={() => void load(true)}>{$_('common.retry')}</Button>
		</div>
	{:else if achievements.length}
		{#if claimError}<p class="text-sm text-destructive" role="alert">
				{$_(`achievements.${claimError}`)}
			</p>{/if}
		<AchievementList {achievements} {claimingCode} onClaim={claim} />
		<Button
			disabled={Boolean(claimingCode) ||
				!achievements.some((item) => item.unlockedAt && !item.claimedAt)}
			onclick={() => claim()}>{$_('completion.claimAll')}</Button
		>
	{:else}
		<EmptyState
			title={$_('achievements.empty_title')}
			description={$_('achievements.empty_description')}
		/>
	{/if}
</section>
