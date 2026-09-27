<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { currentSession } from '$lib/auth/session';
	import { getAchievements } from '$lib/api/achievements';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { DashboardData } from '$lib/types';
	let { dashboard }: { dashboard: DashboardData | null } = $props();
	let claimable = $state(0);

	let loadedAccount: string | undefined;
	let revision = -1;
	let generation = 0;
	onDestroy(() => {
		generation++;
	});
	$effect(() => {
		const account = $currentSession?.user.id;
		const refresh = $realtimeRefresh;
		untrack(() => {
			if (!account) {
				claimable = 0;
				loadedAccount = undefined;
				generation++;
				return;
			}
			if (
				account === loadedAccount &&
				(refresh.revision === revision || !refreshIncludes(refresh, 'achievements'))
			)
				return;
			if (loadedAccount !== account) claimable = 0;
			loadedAccount = account;
			revision = refresh.revision;
			const request = ++generation;
			void getAchievements()
				.then((items) => {
					if (request === generation)
						claimable = items.filter((item) => item.unlockedAt && !item.claimedAt).length;
				})
				.catch(() => undefined);
		});
	});

	const items = $derived([
		{ count: dashboard?.unreadMessages ?? 0, path: '/messages', label: 'navigation.messages' },
		{ count: dashboard?.pendingFriendRequests ?? 0, path: '/friends', label: 'navigation.friends' },
		{
			count: dashboard?.pendingGuildInvitations ?? 0,
			path: '/guild?tab=invitations',
			label: 'completion.guild.invitations'
		},
		{ count: claimable, path: '/achievements', label: 'ux.claimable' },
		{
			count: dashboard?.unreadNotifications ?? 0,
			path: '/notifications',
			label: 'notifications.title'
		}
	]);
</script>

{#if items.some((item) => item.count > 0)}<nav
		class="flex flex-wrap gap-3"
		aria-label={$_('ux.activity')}
	>
		{#each items.filter((item) => item.count > 0) as item (item.path)}<Button
				variant="outline"
				href={item.path}>{$_(item.label)} · {item.count}</Button
			>{/each}
	</nav>{/if}
