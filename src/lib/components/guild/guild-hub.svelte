<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { getMyGuild } from '$lib/api/wikiforge';
	import {
		readGuild,
		searchGuilds,
		readMyGuildInvitations,
		answerGuildInvitation,
		type Guild,
		type GuildInvitation
	} from '$lib/api/guilds';
	import GuildEditor from './guild-editor.svelte';
	import GuildSummary from './guild-summary.svelte';
	import ConfirmAction from '$lib/components/layout/confirm-action.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	import {
		realtimeRefresh,
		refreshIncludes,
		publishRealtimeRefresh
	} from '$lib/realtime/resource-refresh';
	let creating = $state(false);
	let searchRevision = $state(0);
	let revision = 0;
	let mine = $state<Guild | null>(null);
	let invitations = $state<GuildInvitation[]>([]);
	let results = $state<Guild[]>([]);
	let total = $state(0);
	let busy = $state(false);
	let error = $state('');
	let ready = $state(false);
	let query = $state('');
	const tab = $derived(page.url.searchParams.get('tab') ?? 'mine');
	const index = $derived(Math.max(0, Number(page.url.searchParams.get('page')) || 0));
	const search = $derived(page.url.searchParams.get('q') ?? '');
	async function load() {
		busy = true;
		error = '';
		try {
			const [own, invites] = await Promise.all([getMyGuild(), readMyGuildInvitations()]);
			mine = own ? await readGuild(own.id) : null;
			invitations = invites;
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
			ready = true;
		}
	}
	onMount(() => void load());
	$effect(() => {
		const refresh = $realtimeRefresh;
		if (revision === refresh.revision || !refreshIncludes(refresh, 'guild')) return;
		revision = refresh.revision;
		void load();
	});
	$effect(() => {
		void searchRevision;
		const q = search;
		const p = index;
		const active = tab;
		const abort = new AbortController();
		untrack(() => {
			query = q;
			if (active !== 'search') return;
			busy = true;
			error = '';
			void searchGuilds(q, p, { signal: abort.signal })
				.then((value) => {
					if (!abort.signal.aborted) {
						results = value.results;
						total = value.nbResults;
					}
				})
				.catch((cause) => {
					if (!abort.signal.aborted) error = operationError(cause);
				})
				.finally(() => {
					if (!abort.signal.aborted) busy = false;
				});
		});
		return () => abort.abort();
	});
	function change(values: Record<string, string>) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		for (const [key, value] of Object.entries(values)) params.set(key, value);
		void goto(resolve(`/guild?${params}`), { noScroll: true, keepFocus: true });
	}
	async function answer(id: number, accept: boolean) {
		await answerGuildInvitation(id, accept);
		publishRealtimeRefresh(['guild', 'profile']);
		await load();
	}
</script>

<section class="flex flex-col gap-6">
	<header><h1 class="font-title text-3xl">{$_('completion.guild.title')}</h1></header>
	<nav class="flex flex-wrap gap-2" aria-label={$_('completion.guild.title')}>
		{#each ['mine', 'search', 'invitations'] as value (value)}<Button
				variant={tab === value ? 'default' : 'outline'}
				onclick={() => change({ tab: value, page: '0' })}>{$_('completion.guild.' + value)}</Button
			>{/each}
	</nav>
	{#if error}<div role="alert" class="forge-panel p-4">
			<p>{error}</p>
			<Button
				variant="outline"
				onclick={() => {
					if (tab === 'search') searchRevision++;
					else void load();
				}}>{$_('completion.retry')}</Button
			>
		</div>{/if}
	{#if !ready && busy}<p role="status">{$_('completion.loading')}</p>{/if}
	{#if tab === 'mine' && ready && !error}{#if mine}<GuildSummary guild={mine} />{:else}<div
				class="guild-choice"
			>
				<p>
					{$_('completion.guild.noGuild')}
				</p>
				<div class="flex flex-wrap gap-3">
					<Button onclick={() => change({ tab: 'search', page: '0' })}
						>{$_('completion.guild.search')}</Button
					>
					<Button variant="outline" onclick={() => (creating = !creating)}
						>{$_('arcade.createGuild')}</Button
					>
				</div>
			</div>
			{#if creating}<GuildEditor
					onSaved={(guild) => {
						publishRealtimeRefresh(['guild', 'profile']);
						void goto(resolve('/guilds/[id]', { id: String(guild.id) }));
					}}
				/>{/if}{/if}
	{:else if tab === 'search'}<form
			class="flex flex-wrap gap-3"
			onsubmit={(event) => {
				event.preventDefault();
				change({ q: query, page: '0' });
			}}
		>
			<Input
				class="min-w-0 flex-1"
				bind:value={query}
				maxlength={50}
				aria-label={$_('completion.guild.search')}
				placeholder={$_('completion.searchHint')}
			/><Button type="submit" disabled={query.trim().length < 3}
				>{$_('completion.guild.search')}</Button
			>
		</form>
		<div class="grid gap-4 md:grid-cols-2">
			{#each results as guild (guild.id)}<GuildSummary {guild} />{:else}<p>
					{$_(search.length < 3 ? 'completion.searchHint' : 'completion.empty')}
				</p>{/each}
		</div>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<Button
				variant="outline"
				disabled={!index || busy}
				onclick={() => change({ page: String(index - 1) })}>{$_('completion.previous')}</Button
			><span>{$_('completion.page', { values: { page: index + 1, total } })}</span><Button
				variant="outline"
				disabled={(index + 1) * 20 >= total || busy}
				onclick={() => change({ page: String(index + 1) })}>{$_('completion.next')}</Button
			>
		</div>
	{:else if tab === 'invitations'}<p class="text-sm text-muted-foreground">
			{$_('completion.guild.invitationHelp')}
		</p>
		{#each invitations as invitation (invitation.guild?.id)}{#if invitation.guild}<div
					class="flex flex-col gap-3"
				>
					<GuildSummary guild={invitation.guild} />
					<p>
						{$_('completion.guild.invitedBy', { values: { name: invitation.inviterName ?? '' } })}
					</p>
					<div class="flex gap-3">
						<ConfirmAction
							label={$_('completion.guild.accept')}
							description={$_('completion.guild.invitationHelp')}
							disabled={Boolean(mine)}
							onConfirm={() => answer(invitation.guild!.id!, true)}
						/><ConfirmAction
							label={$_('completion.guild.decline')}
							description={invitation.guild.name ?? ''}
							onConfirm={() => answer(invitation.guild!.id!, false)}
						/>
					</div>
				</div>{/if}{:else}<p>{$_('completion.empty')}</p>{/each}{/if}
</section>

<style>
	.guild-choice {
		border-left: 3px solid var(--primary);
		display: grid;
		gap: 16px;
		padding: 24px;
	}
	@media (min-width: 1024px) {
		.guild-choice {
			max-width: 600px;
			padding: 32px;
		}
	}
</style>
