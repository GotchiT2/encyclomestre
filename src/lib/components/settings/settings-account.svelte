<script lang="ts">
	import AccountDeletion from './account-deletion.svelte';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let {
		username = $bindable(''),
		nameLocked = false,
		nameChangeAvailableAt,
		avatarUrl,
		onChooseAvatar = () => undefined,
		onRemoveAvatar = () => undefined,
		onLogout,
		onLogoutAll
	}: {
		username?: string;
		nameLocked?: boolean;
		nameChangeAvailableAt?: string;
		avatarUrl?: string | null;
		onChooseAvatar?: () => void;
		onRemoveAvatar?: () => void;
		onLogout: () => void;
		onLogoutAll: () => void;
	} = $props();
</script>

<div class="flex flex-col gap-4">
	<section class="border-4 border-double border-primary/30 bg-card p-4">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('settings.identity')}
		</p>
		<label class="mt-3 block font-mono text-[10px] uppercase tracking-widest text-primary"
			>{$_('settings.username')}<Input
				bind:value={username}
				disabled={nameLocked}
				aria-describedby={nameLocked ? 'name-change-available' : undefined}
				maxlength={64}
				class="mt-1 font-bold"
			/></label
		>
		{#if nameLocked && nameChangeAvailableAt}<p
				id="name-change-available"
				class="mt-2 text-sm text-muted-foreground"
			>
				{$_('settings.name_change_available', {
					values: { date: new Date(nameChangeAvailableAt).toLocaleString('fr-FR') }
				})}
			</p>{/if}
		<div class="mt-4 flex items-center gap-3">
			{#if avatarUrl}<img
					src={avatarUrl}
					alt=""
					class="size-16 border border-primary/30 object-cover"
				/>{/if}
			<Button variant="outline" onclick={onChooseAvatar}>{$_('settings.choose_avatar')}</Button>
			{#if avatarUrl}<Button variant="ghost" onclick={onRemoveAvatar}
					>{$_('settings.remove_avatar')}</Button
				>{/if}
		</div>
	</section>
	<section class="border-4 border-double border-primary/30 bg-card p-4">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('settings.session')}
		</p>
		<p class="mt-2 italic text-muted-foreground">
			{$_('settings.logout_all_hint')}
		</p>
		<div class="mt-3 flex flex-wrap gap-2">
			<Button variant="outline" onclick={onLogout}>{$_('navigation.logout')}</Button>
			<Button variant="outline" onclick={onLogoutAll}>{$_('settings.logout_all')}</Button>
		</div>
	</section>
</div>

<AccountDeletion />
