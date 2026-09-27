<script lang="ts">
	import { untrack } from 'svelte';
	import { currentSession, verifiedWikiForgeSession } from '$lib/auth/session';
	import { clearPersonalAuctions, refreshPersonalAuctions } from '$lib/auctions/store';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	const userId = $derived($verifiedWikiForgeSession ? $currentSession?.user.id : undefined);
	$effect(() => {
		const id = userId;
		untrack(() => {
			clearPersonalAuctions(id ?? null);
			if (id) void refreshPersonalAuctions(id).catch(() => undefined);
		});
		return () => clearPersonalAuctions();
	});
	$effect(() => {
		const refresh = $realtimeRefresh;
		const id = userId;
		if (
			id &&
			refresh.revision &&
			(refreshIncludes(refresh, 'profile') || refreshIncludes(refresh, 'collection'))
		)
			untrack(() => {
				void refreshPersonalAuctions(id).catch(() => undefined);
			});
	});
</script>
