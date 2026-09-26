<script lang="ts">
	import { onMount } from 'svelte';
	import { currentSession, verifiedWikiForgeSession } from '$lib/auth/session';
	import { _ } from '$lib/i18n';
	import {
		claimableAchievements,
		refreshAchievementSummary,
		resetAchievementSummary
	} from '$lib/achievements/store';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';

	let handledRealtimeRevision = 0;

	onMount(() => {
		if ($currentSession && $verifiedWikiForgeSession) void refreshAchievementSummary().catch(() => undefined);
	});

	$effect(() => {
		if (!$currentSession) {
			resetAchievementSummary();
			return;
		}
		if ($verifiedWikiForgeSession) void refreshAchievementSummary().catch(() => undefined);
	});

	$effect(() => {
		const refresh = $realtimeRefresh;
		if (
			refresh.revision === handledRealtimeRevision ||
			!refreshIncludes(refresh, 'achievements')
		)
			return;
		handledRealtimeRevision = refresh.revision;
		void refreshAchievementSummary(true).catch(() => undefined);
	});
</script>

{#if $claimableAchievements > 0}
	<span
		class="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-black text-primary-foreground"
		aria-label={$_('achievements.claimable_count', { values: { count: $claimableAchievements } })}
	>
		{Math.min($claimableAchievements, 99)}{#if $claimableAchievements > 99}+{/if}
	</span>
{/if}
