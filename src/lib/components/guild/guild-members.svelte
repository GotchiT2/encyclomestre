<script lang="ts">
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
	let busy = $state(false);
	let error = $state('');
	let editing = $state<number>();
	let permissions = $state<GuildPermission[]>([]);
	const all: GuildPermission[] = ['INVITE', 'KICK', 'GRANT', 'EDIT'];
	const self = $derived(Number($currentSession?.user.id));
	async function load() {
		busy = true;
		error = '';
		try {
			const result = await readGuildMembers(guild.id, page);
			members = result.results;
			total = result.nbResults;
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}
	$effect(() => {
		const id = guild.id;
		const index = page;
		untrack(() => {
			void id;
			void index;
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
			class="h-11 border border-border bg-background px-3"
		/></label
	>
	<p class="text-sm text-muted-foreground">{$_('ux.permissionHelp')}</p>
	{#if error}<p role="alert" class="text-destructive">{error}</p>
		<Button onclick={() => void load()}>{$_('completion.retry')}</Button>{/if}
	{#each members.filter((member) => member.name
			.toLocaleLowerCase()
			.includes(query.toLocaleLowerCase())) as member (member.id)}<article
			class="forge-panel flex flex-col gap-3 p-4"
		>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<a
					class="flex min-w-0 items-center gap-3 underline"
					href={resolve('/users/[id]', { id: String(member.id) })}
					>{#if member.image}<img
							src={member.image}
							alt=""
							class="size-10 object-cover"
						/>{/if}<span>{member.name}</span></a
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
			disabled={(page + 1) * 20 >= total || busy}
			onclick={() => page++}>{$_('completion.next')}</Button
		>
	</div>
</div>
