<script lang="ts">
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { wikiForgeUtcDate } from '$lib/api/wikiforge-contract';
	import {
		readGuildMembers,
		canManageMember,
		kickGuildMember,
		transferGuild,
		grantGuildPermissions,
		type Guild,
		type GuildMember,
		type GuildPermission
	} from '$lib/api/guilds';
	import { currentSession } from '$lib/auth/session';
	import { Button } from '$lib/components/ui/button';
	import ConfirmAction from '$lib/components/layout/confirm-action.svelte';
	import ReportDialog from '$lib/components/reports/report-dialog.svelte';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	let { guild, onChanged }: { guild: Guild; onChanged: () => Promise<void> } = $props();
	let query = $state('');
	let members = $state<GuildMember[]>([]);
	let page = $state(0);
	let total = $state(0);
	let nbMembers = $state(0);
	let hasNext = $state(false);
	let generation = 0;
	let busy = $state(false);
	let error = $state('');
	let editing = $state<number>();
	let permissions = $state<GuildPermission[]>([]);
	const all: GuildPermission[] = ['INVITE', 'KICK', 'GRANT', 'EDIT'];
	const self = $derived(Number($currentSession?.user.id));
	async function load() {
		const own = ++generation;
		busy = true;
		error = '';
		try {
			const result = await readGuildMembers(guild.id, page, undefined, query);
			if (own !== generation) return;
			nbMembers = result.nbMembers;
			hasNext = result.hasNext;
			members = result.results;
			total = result.nbResults;
		} catch (cause) {
			if (own === generation) error = operationError(cause);
		} finally {
			if (own === generation) busy = false;
		}
	}
	$effect(() => {
		const id = guild.id;
		const index = page;
		const search = query;
		untrack(() => {
			void id;
			void index;
			void search;
			void load();
		});
	});
	async function update(action: () => Promise<unknown>) {
		await action();
		editing = undefined;
		await onChanged();
		await load();
	}
</script>

<div class="flex flex-col gap-4">
	<label class="flex flex-col gap-2"
		>{$_('ux.memberSearch')}<input
			type="search"
			bind:value={query}
			oninput={() => (page = 0)}
			class="h-11 border border-border bg-background px-3"
		/></label
	>
	<p class="text-sm text-muted-foreground">
		{$_('ux.permissionHelp')} · {$_('apiEvolution.members', {
			values: { total: nbMembers, matches: total }
		})}
	</p>
	{#if error}<p role="alert" class="text-destructive">{error}</p>
		<Button onclick={() => void load()}>{$_('completion.retry')}</Button>{/if}
	{#each members as member (member.id)}<article class="forge-panel flex flex-col gap-3 p-4">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<a
					class="flex min-w-0 items-center gap-3 underline"
					href={resolve('/users/[id]', { id: String(member.id) })}
					><UserAvatar image={member.image} crop={member.imageCrop} name={member.name} /><span
						>{member.name}</span
					></a
				><span class="text-sm"
					>{member.owner
						? $_('completion.guild.owner')
						: member.permissions
								.map((permission) => $_('completion.guild.permission_' + permission))
								.join(' · ')}</span
				>
			</div>
			{#if member.joinedAt}<p class="text-xs text-muted-foreground">
					{$_('completion.guild.joined', {
						values: { date: wikiForgeUtcDate(member.joinedAt).toLocaleDateString('fr-FR') }
					})}
				</p>{/if}
			<div class="flex flex-wrap gap-2">
				{#if member.id !== self}<ReportDialog
						target={{ type: 'USER', id: member.id }}
						title={member.name}
						userId={member.id}
					/>{/if}
				{#if canManageMember(guild, member, self, 'GRANT')}<Button
						variant="outline"
						onclick={() => {
							editing = member.id;
							permissions = [...member.permissions];
						}}>{$_('completion.guild.permissions')}</Button
					>{/if}
				{#if canManageMember(guild, member, self, 'KICK')}<ConfirmAction
						destructive
						label={$_('completion.guild.kick')}
						description={member.name + ' · ' + $_('completion.guild.kickHelp')}
						onConfirm={() => update(() => kickGuildMember(guild.id, member.id))}
					/>{/if}
				{#if guild.owned && member.id !== self}<ConfirmAction
						label={$_('completion.guild.transfer')}
						description={member.name + ' · ' + $_('completion.guild.transferHelp')}
						onConfirm={() => update(() => transferGuild(guild.id, member.id))}
					/>{/if}
			</div>
			{#if editing === member.id}<fieldset class="flex flex-col gap-3 border border-border p-4">
					<legend>{$_('completion.guild.permissions')}</legend
					>{#each all as permission (permission)}<label class="flex items-center gap-2"
							><input
								type="checkbox"
								value={permission}
								bind:group={permissions}
								disabled={!guild.permissions.includes(permission)}
							/>{$_('completion.guild.permission_' + permission)}</label
						>{/each}<ConfirmAction
						label={$_('completion.save')}
						description={permissions
							.map((permission) => $_('completion.guild.permission_' + permission))
							.join(', ') || $_('completion.guild.noPermissions')}
						onConfirm={() => update(() => grantGuildPermissions(guild.id, member.id, permissions))}
					/>
				</fieldset>{/if}
		</article>{/each}
	<div class="flex flex-wrap justify-between gap-3">
		<Button variant="outline" disabled={!page || busy} onclick={() => page--}
			>{$_('completion.previous')}</Button
		><span>{$_('completion.page', { values: { page: page + 1, total } })}</span><Button
			variant="outline"
			disabled={!hasNext || busy}
			onclick={() => page++}>{$_('completion.next')}</Button
		>
	</div>
</div>
