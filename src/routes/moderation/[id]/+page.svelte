<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import { getModerationCase, type ModerationCase } from '$lib/api/moderation';
	import CaseThread from '$lib/components/moderation/case-thread.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	let item = $state<ModerationCase>();
	let error = $state('');
	let busy = $state(false);
	let generation = 0;
	let revision = 0;
	async function load(id: string) {
		const own = ++generation;
		busy = true;
		error = '';
		try {
			const result = await getModerationCase(id);
			if (own === generation) item = result;
		} catch (cause) {
			if (own === generation) error = operationError(cause);
		} finally {
			if (own === generation) busy = false;
		}
	}
	$effect(() => {
		const id = page.params.id!;
		untrack(() => {
			item = undefined;
			void load(id);
		});
		return () => {
			generation++;
		};
	});
	$effect(() => {
		const event = $realtimeRefresh;
		if (event.revision !== revision && refreshIncludes(event, 'moderation')) {
			revision = event.revision;
			untrack(() => {
				if (!busy) void load(page.params.id!);
			});
		}
	});
</script>

<div class="flex flex-col gap-5">
	<div class="flex flex-wrap justify-between gap-3">
		<Button variant="outline" href={resolve('/moderation')}
			>{$_('completion.moderation.cases')}</Button
		><Button variant="outline" disabled={busy} onclick={() => void load(page.params.id!)}
			>{$_('completion.refresh')}</Button
		>
	</div>
	{#if error}<p role="alert" class="text-destructive">
			{error}
		</p>{/if}{#if item}{#key item.id}<CaseThread
				{item}
				onUpdate={(updated) => (item = updated)}
			/>{/key}{:else if busy}<p role="status">{$_('completion.loading')}</p>{/if}
</div>
