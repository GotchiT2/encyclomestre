<script lang="ts">
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import GiftIcon from '@lucide/svelte/icons/gift';
	import LockKeyholeIcon from '@lucide/svelte/icons/lock-keyhole';
	import TrophyIcon from '@lucide/svelte/icons/trophy';
	import { _ } from '$lib/i18n';
	import { achievementState, type Achievement } from '$lib/types';

	let {
		achievements,
		claimingCode = null,
		onClaim
	}: {
		achievements: Achievement[];
		claimingCode?: string | null;
		onClaim: (achievement: Achievement) => void;
	} = $props();

	function progress(achievement: Achievement) {
		return achievement.threshold > 0
			? Math.min(100, Math.max(0, (achievement.progress / achievement.threshold) * 100))
			: 0;
	}

	function categoryLabel(category: string) {
		const known = new Set(['COLLECTION', 'BOOSTER', 'TRADE', 'SALE', 'SOCIAL', 'MONEY']);
		return known.has(category)
			? $_(`achievements.category.${category}`)
			: $_('achievements.category_unknown', { values: { category } });
	}
</script>

<div class="grid gap-3 lg:grid-cols-2">
	{#each achievements as achievement (achievement.code)}
		{@const state = achievementState(achievement)}
		<article
			class:opacity-70={state === 'LOCKED'}
			class="forge-panel-flat relative overflow-hidden p-4"
		>
			<div class="flex items-start gap-3">
				<span class="grid size-10 shrink-0 place-items-center border border-primary/35 bg-background text-primary">
					{#if state === 'DONE'}<CheckCircle2Icon class="size-5" />
					{:else if state === 'LOCKED'}<LockKeyholeIcon class="size-5" />
					{:else}<TrophyIcon class="size-5" />{/if}
				</span>
				<div class="min-w-0 flex-1">
					<p class="forge-label">{categoryLabel(achievement.category)}</p>
					<h2 class="mt-1 font-title text-lg leading-tight">{achievement.name}</h2>
					{#if achievement.description}<p class="mt-1 text-sm text-muted-foreground">{achievement.description}</p>{/if}
				</div>
			</div>

			<div class="mt-4">
				<div class="mb-1 flex justify-between gap-3 text-xs text-muted-foreground">
					<span>{$_(`achievements.state.${state}`)}</span>
					<span>{achievement.progress} / {achievement.threshold}</span>
				</div>
				<div
					class="h-2 overflow-hidden bg-background"
					role="progressbar"
					aria-label={$_('achievements.progress')}
					aria-valuemin="0"
					aria-valuemax={achievement.threshold}
					aria-valuenow={achievement.progress}
				>
					<div class="h-full bg-primary transition-[width]" style={`width: ${progress(achievement)}%`}></div>
				</div>
			</div>

			<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
				<GiftIcon class="size-4 text-primary" />
				{#if achievement.rewardMoney > 0}<span>{$_('achievements.reward_money', { values: { amount: achievement.rewardMoney } })}</span>{/if}
				{#each Object.entries(achievement.rewardBoosters ?? {}) as [family, amount] (family)}
					<span class="border border-energy/40 bg-energy/10 px-2 py-0.5 text-energy-soft">
						{$_('achievements.reward_booster', { values: { count: amount, family } })}
					</span>
				{/each}
				{#if achievement.rewardMoney === 0 && !Object.keys(achievement.rewardBoosters ?? {}).length}
					<span class="text-muted-foreground">{$_('achievements.no_reward')}</span>
				{/if}
				{#if state === 'CLAIMABLE'}
					<button
						class="ml-auto min-h-9 border border-primary bg-primary px-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
						disabled={claimingCode === achievement.code}
						onclick={() => onClaim(achievement)}
					>
						{claimingCode === achievement.code ? $_('achievements.claiming') : $_('achievements.claim')}
					</button>
				{/if}
			</div>
		</article>
	{/each}
</div>
