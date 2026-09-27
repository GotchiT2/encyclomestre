<script lang="ts">
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { readGuild, type Guild } from '$lib/api/guilds';
	import GuildDetail from '$lib/components/guild/guild-detail.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	let guild = $state<Guild>();
	let error = $state('');
	let busy = $state(false);
	let generation = 0;
	let revision = 0;
	async function load() {
		const own = ++generation;
		busy = true;
		error = '';
		try {
			const value = await readGuild(page.params.id!);
			if (own === generation) guild = value;
		} catch (cause) {
			if (own === generation) error = operationError(cause);
		} finally {
			if (own === generation) busy = false;
		}
	}
	$effect(() => {
		const id = page.params.id;
		untrack(() => {
			void id;
			guild = undefined;
			void load();
		});
		return () => {
			generation++;
		};
	});
	$effect(() => {
		const event = $realtimeRefresh;
		if (event.revision !== revision && refreshIncludes(event, 'guild')) {
			revision = event.revision;
			untrack(() => {
				if (!busy) void load();
			});
		}
	});
</script>

<svelte:head><title>{guild?.name ?? $_('completion.guild.title')} · WikiForge</title></svelte:head>
{#if error}<div role="alert" class="forge-panel flex flex-col gap-3 p-5">
		<p>{error}</p>
		<Button onclick={() => void load()}>{$_('completion.retry')}</Button>
	</div>{/if}{#if guild}{#key guild.id}<GuildDetail
			{guild}
			onChanged={load}
		/>{/key}{:else if busy}<p role="status">{$_('completion.loading')}</p>{/if}
