<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { getModerationCases, type ModerationCase } from '$lib/api/moderation';
	import SanctionNotice from '$lib/components/moderation/sanction-notice.svelte';
	import CaseList from '$lib/components/moderation/case-list.svelte';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { operationError } from '$lib/domain/operation-error';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	let cases = $state<ModerationCase[]>([]);
	let busy = $state(false);
	let error = $state('');
	let ready = $state(false);
	let revision = 0;
	async function load() {
		if (busy) return;
		busy = true;
		error = '';
		try {
			cases = await getModerationCases();
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}
	onMount(() => void load().finally(() => (ready = true)));
	$effect(() => {
		const event = $realtimeRefresh;
		if (ready && revision !== event.revision && refreshIncludes(event, 'moderation')) {
			revision = event.revision;
			untrack(() => void load());
		}
	});
</script>

<svelte:head><title>{$_('completion.moderation.title')} · WikiForge</title></svelte:head>
<section class="flex flex-col gap-6">
	<header class="flex flex-wrap justify-between gap-4">
		<div>
			<h1 class="font-title text-3xl">{$_('completion.moderation.title')}</h1>
			<p class="mt-2 text-muted-foreground">{$_('completion.moderation.description')}</p>
		</div>
		<Button variant="outline" disabled={busy} onclick={() => void load()}
			>{$_('completion.refresh')}</Button
		>
	</header>
	<h2 class="font-heading text-xl">{$_('completion.moderation.sanctions')}</h2>
	<SanctionNotice showEmpty />
	<h2 class="font-heading text-xl">{$_('completion.moderation.cases')}</h2>
	{#if error}<p role="alert" class="text-destructive">{error}</p>{/if}{#if busy && !ready}<p
			role="status"
		>
			{$_('completion.loading')}
		</p>{:else}<CaseList {cases} />{/if}
</section>
