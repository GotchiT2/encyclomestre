<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from '$lib/i18n';
	import {
		getPasskeys,
		getRegistrationOptions,
		savePasskey,
		removePasskey,
		getReauthentication,
		regenerateRecoveryCodes
	} from '$lib/passkeys/api';
	import {
		registerPasskey,
		cancelPasskey,
		passkeyAvailable,
		passkeyErrorKey,
		type PasskeyDTO
	} from '$lib/passkeys/webauthn';
	import { getCurrentUser } from '$lib/api/users';
	import { currentSession, persistSession } from '$lib/auth/session';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Dialog from '$lib/components/ui/dialog';
	import Reauthentication from './reauthentication.svelte';
	import RecoveryCodes from './recovery-codes.svelte';
	let { onLogoutAll }: { onLogoutAll: () => Promise<void> } = $props();
	let items = $state<PasskeyDTO[]>([]);
	let loading = $state(true);
	let busy = $state(false);
	let available = $state(false);
	let unavailableKey = $state('passkeys.errors.unsupported');
	let error = $state('');
	let notice = $state('');
	let open = $state(false);
	let deleteOpen = $state(false);
	let deleting = $state<PasskeyDTO>();
	let label = $state('');
	let recoveryCode = $state('');
	let codes = $state<string[]>([]);
	let codesOpen = $state(false);
	let alive = true;
	const date = (value?: string) =>
		value && Number.isFinite(Date.parse(value))
			? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
					new Date(value)
				)
			: $_('plan.unknownDate');
	async function load() {
		loading = true;
		try {
			const data = await getPasskeys();
			if (alive) items = data;
		} catch (cause) {
			if (alive) error = passkeyErrorKey(cause);
		} finally {
			if (alive) loading = false;
		}
	}
	async function refreshUser() {
		const user = await getCurrentUser();
		if ($currentSession) persistSession(localStorage, { ...$currentSession, user });
	}
	$effect(() => {
		if (!open && !codesOpen) {
			recoveryCode = '';
			cancelPasskey();
		}
	});
	onMount(() => {
		available = passkeyAvailable();
		unavailableKey = window.isSecureContext
			? 'passkeys.errors.unsupported'
			: 'passkeys.errors.insecure';
		void load();
	});
	onDestroy(() => {
		alive = false;
		cancelPasskey();
		codes = [];
		recoveryCode = '';
	});
	async function add(event: SubmitEvent) {
		event.preventDefault();
		if (busy || !label.trim() || items.length >= 10) return;
		busy = true;
		error = '';
		notice = '';
		try {
			const reauth = await getReauthentication(recoveryCode);
			if (!alive || !open) return;
			const options = await getRegistrationOptions();
			const credential = await registerPasskey(options);
			if (!alive || !open) return;
			await savePasskey(label.trim(), credential, reauth);
			if (!alive) return;
			open = false;
			label = '';
			notice = 'passkeys.added';
			await load();
			await refreshUser();
		} catch (cause) {
			if (alive) error = passkeyErrorKey(cause);
		} finally {
			recoveryCode = '';
			if (alive) busy = false;
		}
	}
	async function regenerate(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		busy = true;
		error = '';
		try {
			const result = await regenerateRecoveryCodes(await getReauthentication(recoveryCode));
			if (!alive) return;
			codes = result.codes;
			await refreshUser();
		} catch (cause) {
			if (alive) error = passkeyErrorKey(cause);
		} finally {
			recoveryCode = '';
			if (alive) busy = false;
		}
	}
	async function remove() {
		if (busy || !deleting) return;
		busy = true;
		error = '';
		try {
			await removePasskey(deleting.id);
			if (alive) {
				deleteOpen = false;
				notice = 'passkeys.removed';
				await load();
			}
		} catch (cause) {
			if (alive) error = passkeyErrorKey(cause);
		} finally {
			if (alive) busy = false;
		}
	}
	async function logoutAll() {
		if (busy) return;
		busy = true;
		error = '';
		try {
			await onLogoutAll();
		} catch (cause) {
			if (alive) error = passkeyErrorKey(cause);
		} finally {
			if (alive) busy = false;
		}
	}
</script>

<section class="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="text-xl font-semibold">{$_('passkeys.title')}</h2>
			<p class="mt-2 max-w-2xl text-sm text-muted-foreground">{$_('passkeys.description')}</p>
		</div>
		<Button
			disabled={busy || loading || !available || items.length >= 10}
			onclick={() => {
				error = '';
				notice = '';
				open = true;
			}}>{$_('passkeys.add')}</Button
		>
	</div>
	{#if !available}<p class="text-sm text-muted-foreground">
			{$_(unavailableKey)}
		</p>{/if}
	{#if items.length >= 10}<p class="text-sm text-muted-foreground">{$_('passkeys.limit')}</p>{/if}
	{#if error && !open && !deleteOpen}<p role="alert" class="text-sm text-destructive">
			{$_(error)}
		</p>
		<Button
			variant="outline"
			disabled={busy}
			onclick={() => {
				error = '';
				void load();
			}}>{$_('passkeys.retry')}</Button
		>{/if}
	{#if notice}<p role="status" class="text-sm">{$_(notice)}</p>{/if}
	{#if loading}<p role="status">{$_('passkeys.loading')}</p>{:else}
		<ul class="space-y-3">
			{#each items as item (item.id)}<li
					class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
				>
					<div class="min-w-0">
						<strong class="break-words">{item.label}</strong>
						<p class="text-sm text-muted-foreground">
							{$_(item.synced ? 'passkeys.synced' : 'passkeys.device')}
						</p>
						<p class="mt-1 text-xs text-muted-foreground">
							{$_('passkeys.dates', {
								values: { created: date(item.createdAt), used: date(item.lastUsedAt) }
							})}
						</p>
					</div>
					<Button
						variant="outline"
						disabled={busy}
						onclick={() => {
							deleting = item;
							error = '';
							deleteOpen = true;
						}}>{$_('passkeys.remove')}</Button
					>
				</li>{:else}<li class="text-sm text-muted-foreground">{$_('passkeys.empty')}</li>{/each}
		</ul>{/if}
	<p class="text-sm text-muted-foreground">{$_('passkeys.removalInfo')}</p>
	<Button variant="outline" disabled={busy} onclick={logoutAll}>{$_('passkeys.logoutAll')}</Button>
</section>
<Dialog.Root bind:open
	><Dialog.Content class="max-h-[90dvh] overflow-y-auto p-4 sm:p-5"
		><Dialog.Header class="pr-12"
			><Dialog.Title>{$_('passkeys.add')}</Dialog.Title><Dialog.Description
				>{$_('passkeys.addDescription')}</Dialog.Description
			></Dialog.Header
		>
		<form class="space-y-4" onsubmit={add}>
			<label class="block space-y-2"
				><span>{$_('passkeys.label')}</span><Input
					bind:value={label}
					maxlength={64}
					required
					disabled={busy}
				/></label
			>
			<Reauthentication bind:code={recoveryCode} disabled={busy} />
			{#if error}<p role="alert" class="text-sm text-destructive">{$_(error)}</p>{/if}
			<Dialog.Footer
				><Button
					type="button"
					variant="outline"
					disabled={busy}
					onclick={() => {
						open = false;
					}}>{$_('passkeys.cancel')}</Button
				><Button type="submit" disabled={busy || !available || !label.trim()}
					>{busy ? $_('passkeys.waiting') : $_('passkeys.add')}</Button
				></Dialog.Footer
			>
		</form></Dialog.Content
	></Dialog.Root
>
<Dialog.Root bind:open={deleteOpen}
	><Dialog.Content class="p-4 sm:p-5"
		><Dialog.Header class="pr-12"
			><Dialog.Title
				>{$_('passkeys.removeTitle', { values: { label: deleting?.label ?? '' } })}</Dialog.Title
			><Dialog.Description>{$_('passkeys.removalInfo')}</Dialog.Description></Dialog.Header
		>{#if error}<p role="alert" class="text-sm text-destructive">{$_(error)}</p>{/if}<Dialog.Footer
			><Button
				variant="outline"
				disabled={busy}
				onclick={() => {
					deleteOpen = false;
				}}>{$_('passkeys.cancel')}</Button
			><Button variant="destructive" disabled={busy} onclick={remove}
				>{$_('passkeys.remove')}</Button
			></Dialog.Footer
		></Dialog.Content
	></Dialog.Root
>

<section class="forge-panel mt-6 space-y-3 p-4 sm:p-6">
	<h2 class="text-xl font-semibold">{$_('plan.account.codesTitle')}</h2>
	<p>
		{$_('plan.account.remaining', { values: { count: $currentSession?.user.recoveryCodes ?? 0 } })}
	</p>
	<Button
		disabled={busy}
		variant="outline"
		onclick={() => {
			codesOpen = true;
			codes = [];
			error = '';
		}}>{$_('plan.account.regenerate')}</Button
	>
</section>
<Dialog.Root
	bind:open={codesOpen}
	onOpenChange={(value) => {
		if (!value) codes = [];
	}}
>
	<Dialog.Content class="max-h-[90dvh] overflow-y-auto"
		><Dialog.Header class="pr-12"
			><Dialog.Title>{$_('plan.account.codesTitle')}</Dialog.Title><Dialog.Description
				>{$_('plan.account.replaceCodes')}</Dialog.Description
			></Dialog.Header
		>
		{#if codes.length}<RecoveryCodes
				{codes}
				onDone={() => {
					codes = [];
					codesOpen = false;
				}}
			/>{:else}<form class="space-y-4" onsubmit={regenerate}>
				<Reauthentication bind:code={recoveryCode} disabled={busy} />{#if error}<p
						role="alert"
						class="text-destructive"
					>
						{$_(error)}
					</p>{/if}<Button type="submit" disabled={busy}>{$_('plan.account.regenerate')}</Button>
			</form>{/if}
	</Dialog.Content>
</Dialog.Root>
