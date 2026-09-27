<script lang="ts">
	import { onMount } from 'svelte';
	import {
		readGuildInvitations,
		inviteGuildMember,
		type Guild,
		type GuildInvitee
	} from '$lib/api/guilds';
	import type { User } from '$lib/types';
	import GuildEditor from './guild-editor.svelte';
	import UserPicker from '$lib/components/selectors/user-picker.svelte';
	import ConfirmAction from '$lib/components/layout/confirm-action.svelte';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	import { wikiForgeUtcDate } from '$lib/api/wikiforge-contract';
	let { guild, onChanged }: { guild: Guild; onChanged: () => Promise<void> } = $props();
	let invites = $state<GuildInvitee[]>([]);
	let selected = $state<User>();
	let error = $state('');
	async function load() {
		if (!guild.permissions.includes('INVITE')) return;
		try {
			invites = await readGuildInvitations(guild.id);
		} catch (cause) {
			error = operationError(cause);
		}
	}
	onMount(() => void load());
	async function invite() {
		if (!selected) return;
		await inviteGuildMember(guild.id, Number(selected.id));
		selected = undefined;
		await load();
	}
</script>

<div class="flex flex-col gap-6">
	{#if guild.permissions.includes('EDIT')}<GuildEditor
			{guild}
			onSaved={() => void onChanged()}
		/>{/if}{#if guild.permissions.includes('INVITE')}<section
			class="forge-panel flex flex-col gap-4 p-5"
		>
			<h2 class="font-heading text-xl">{$_('completion.guild.invite')}</h2>
			<UserPicker onChoose={(user) => (selected = user)} />{#if selected}<ConfirmAction
					label={$_('completion.guild.invite')}
					description={selected.username}
					onConfirm={invite}
				/>{/if}
		</section>{/if}
	<section class="forge-panel flex flex-col gap-3 p-5">
		<h2 class="font-heading text-xl">{$_('completion.guild.invited')}</h2>
		{#if error}<p role="alert">{error}</p>{/if}{#each invites as invitation (invitation.id)}<p>
				{invitation.name} · {invitation.invitedAt
					? wikiForgeUtcDate(invitation.invitedAt).toLocaleDateString('fr-FR')
					: ''}
			</p>{:else}<p>{$_('completion.empty')}</p>{/each}
	</section>
</div>
