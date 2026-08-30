<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let {
		username = $bindable(''),
		avatarUrl,
		onChooseAvatar = () => undefined,
		onLogout,
		onLogoutAll,
		onDelete
	}: {
		username?: string;
		avatarUrl?: string | null;
		onChooseAvatar?: () => void;
		onLogout: () => void;
		onLogoutAll: () => void;
		onDelete: () => void;
	} = $props();
	let confirmOpen = $state(false);
</script>

<div class="flex flex-col gap-4">
	<section class="border-4 border-double border-primary/30 bg-card p-4">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('settings.identity')}
		</p>
		<label class="mt-3 block font-mono text-[10px] uppercase tracking-widest text-primary"
			>{$_('settings.username')}<Input bind:value={username} class="mt-1 font-bold" /></label
		>
		<div class="mt-4 flex items-center gap-3">
			{#if avatarUrl}<img
					src={avatarUrl}
					alt=""
					class="size-16 border border-primary/30 object-cover"
				/>{/if}
			<Button variant="outline" onclick={onChooseAvatar}>{$_('settings.choose_avatar')}</Button>
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
	<section class="border border-destructive/50 bg-destructive/10 p-4">
		<p class="font-mono text-[10px] uppercase tracking-widest text-destructive">
			{$_('settings.danger')}
		</p>
		<p class="mt-2 italic text-muted-foreground">{$_('settings.delete_hint')}</p>
		<Button variant="destructive" class="mt-3" onclick={() => (confirmOpen = true)}
			>{$_('settings.delete_account')}</Button
		>
	</section>
</div>

<Dialog.Root bind:open={confirmOpen}
	><Dialog.Portal
		><Dialog.Overlay class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" /><Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 border-4 border-double border-destructive/50 bg-card p-5 shadow-2xl"
			><Dialog.Title class="text-2xl font-black uppercase"
				>{$_('settings.delete_confirm_title')}</Dialog.Title
			>
			<p class="mt-3 italic text-muted-foreground">
				{$_('settings.delete_confirm_body')}
			</p>
			<div class="mt-5 flex justify-end gap-2">
				<Button variant="outline" onclick={() => (confirmOpen = false)}
					>{$_('common.cancel')}</Button
				><Button variant="destructive" onclick={onDelete}>{$_('settings.delete_account')}</Button>
			</div></Dialog.Content
		></Dialog.Portal
	></Dialog.Root
>
