<script lang="ts">
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import { currentSession } from '$lib/auth/session';
	import AccountDeletion from './account-deletion.svelte';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let {
		view = 'all',
		username = $bindable(''),
		nameLocked = false,
		nameChangeAvailableAt,
		avatarUrl,
		onChooseAvatar = () => undefined,
		onRemoveAvatar = () => undefined,
		onLogout,
		onLogoutAll
	}: {
		view?: 'all' | 'profile' | 'security';
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
	<section hidden={view === 'security'} class="border-b border-border pb-6">
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
		<div class="mt-4 flex flex-wrap items-center gap-3">
			<UserAvatar
				image={avatarUrl}
				crop={$currentSession?.user.imageCrop}
				name={username}
				class="size-16"
			/>
			<Button variant="outline" onclick={onChooseAvatar}>{$_('settings.choose_avatar')}</Button>
			{#if avatarUrl}<Button variant="ghost" onclick={onRemoveAvatar}
					>{$_('settings.remove_avatar')}</Button
				>{/if}
		</div>
	</section>
	<section hidden={view === 'profile'} class="border-b border-border py-6">
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

<div hidden={view === 'profile'} class="mt-6"><AccountDeletion /></div>
