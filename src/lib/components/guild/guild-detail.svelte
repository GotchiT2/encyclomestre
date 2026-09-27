<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Guild } from '$lib/api/guilds';
	import { joinGuild, leaveGuild, dissolveGuild } from '$lib/api/guilds';
	import { publishRealtimeRefresh } from '$lib/realtime/resource-refresh';
	import GuildMembers from './guild-members.svelte';
	import GuildChat from './guild-chat.svelte';
	import GuildManagement from './guild-management.svelte';
	import GuildWishlists from './guild-wishlists.svelte';
	import ConfirmAction from '$lib/components/layout/confirm-action.svelte';
	import ReportDialog from '$lib/components/reports/report-dialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { _ } from '$lib/i18n';
	let { guild, onChanged }: { guild: Guild; onChanged: () => Promise<void> } = $props();
	const tab = $derived(page.url.searchParams.get('tab') ?? 'overview');
	const tabs = $derived(
		guild.member
			? [
					'overview',
					'members',
					'chat',
					'wishlists',
					...(guild.permissions.some(
						(permission) => permission === 'EDIT' || permission === 'INVITE'
					)
						? ['manage']
						: [])
				]
			: ['overview', 'members']
	);
	async function mutate(action: () => Promise<unknown>, exit = false) {
		await action();
		publishRealtimeRefresh(['guild', 'profile']);
		if (exit) await goto(resolve('/guild'));
		else await onChanged();
	}
</script>

<section class="flex min-w-0 flex-col gap-6">
	<header class="forge-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
		{#if guild.image}<img src={guild.image} alt="" class="size-24 object-cover" />{/if}
		<div class="flex min-w-0 flex-1 flex-col gap-3">
			<h1 class="break-words font-title text-3xl">{guild.name}</h1>
			<div class="flex flex-wrap gap-2">
				<Badge variant="outline">{$_('completion.guild.' + guild.joinPolicy)}</Badge><Badge
					variant="outline"
					>{$_('completion.guild.capacity', {
						values: { count: guild.nbMembers ?? 0, max: guild.maxMembers ?? 0 }
					})}</Badge
				>
			</div>
			{#if guild.owner}<a
					class="underline"
					href={resolve('/users/[id]', { id: String(guild.owner.id) })}
					>{$_('completion.guild.owner')} : {guild.owner.name}</a
				>{/if}
		</div>
		{#if !guild.owned}<ReportDialog
				target={{ type: 'GUILD', id: guild.id }}
				title={guild.name}
				userId={guild.owner?.id}
			/>{/if}
	</header>
	<nav class="flex flex-wrap gap-2" aria-label={$_('completion.guild.title')}>
		{#each tabs as value (value)}<Button
				variant={tab === value ? 'default' : 'outline'}
				href={resolve('/guilds/[id]', { id: String(guild.id) }) + '?tab=' + value}
				>{$_('completion.guild.' + value)}</Button
			>{/each}
	</nav>
	{#if tab === 'members'}<GuildMembers
			{guild}
			{onChanged}
		/>{:else if tab === 'chat' && guild.member}<GuildChat
			guildId={guild.id}
		/>{:else if tab === 'wishlists' && guild.member}<GuildWishlists
			guildId={guild.id}
		/>{:else if tab === 'manage' && guild.member}<GuildManagement {guild} {onChanged} />{:else}<div
			class="forge-panel flex flex-wrap gap-3 p-5"
		>
			{#if !guild.member && guild.joinPolicy === 'PUBLIC'}<ConfirmAction
					label={$_('completion.guild.join')}
					description={guild.name}
					onConfirm={() => mutate(() => joinGuild(guild.id))}
				/>{/if}{#if guild.member && !guild.owned}<ConfirmAction
					destructive
					label={$_('completion.guild.leave')}
					description={$_('completion.guild.leaveHelp')}
					onConfirm={() => mutate(() => leaveGuild(guild.id), true)}
				/>{/if}{#if guild.owned}<ConfirmAction
					destructive
					label={$_('completion.guild.dissolve')}
					description={$_('completion.guild.dissolveHelp')}
					onConfirm={() => mutate(() => dissolveGuild(guild.id), true)}
				/>{/if}{#if !guild.member && guild.joinPolicy === 'INVITE'}<p>
					{$_('completion.guild.INVITE')}
				</p>{/if}
		</div>{/if}
</section>
