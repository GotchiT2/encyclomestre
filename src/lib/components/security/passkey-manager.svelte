<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import {
		getPasskeys,
		getRegistrationOptions,
		savePasskey,
		removePasskey,
		isPasskeyMock
	} from '$lib/passkeys/api';
	import {
		registerPasskey,
		cancelPasskey,
		passkeyAvailable,
		passkeyErrorKey,
		type PasskeyDTO,
		type RegistrationResponseJSON
	} from '$lib/passkeys/webauthn';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Dialog from '$lib/components/ui/dialog';
	import TurnstileWidget from '$lib/components/security/turnstile-widget.svelte';
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
	let password = $state('');
	let credential: RegistrationResponseJSON | undefined;
	let expiresAt = 0;
	let expirationTimer: ReturnType<typeof setTimeout> | undefined;
	let alive = true;
	let turnstile = $state<{ verify: () => Promise<string>; reset: () => void } | null>(null);
	const date = (value: string) =>
		new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(value)
		);
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
	function clearCeremony() {
		clearTimeout(expirationTimer);
		credential = undefined;
		expiresAt = 0;
		password = '';
		cancelPasskey();
	}
	$effect(() => {
		if (!open) clearCeremony();
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
		clearCeremony();
	});
	async function add(event: SubmitEvent) {
		event.preventDefault();
		if (busy || !label.trim() || !password || items.length >= 10) return;
		busy = true;
		error = '';
		notice = '';
		let submitted = false;
		try {
			if (!credential || Date.now() >= expiresAt) {
				const options = await getRegistrationOptions();
				if (!alive || !open) return;
				expiresAt = Date.now() + 5 * 60 * 1000;
				clearTimeout(expirationTimer);
				expirationTimer = setTimeout(
					() => {
						credential = undefined;
						expiresAt = 0;
					},
					5 * 60 * 1000
				);
				credential = await registerPasskey(options);
			}
			if (!alive || !open) return;
			turnstile?.reset();
			const token = isPasskeyMock() ? 'mock-passkey-token' : await turnstile?.verify();
			if (!alive || !open) return;
			if (!credential || Date.now() >= expiresAt)
				throw new Error('passkeys.errors.PASSKEY_REJECTED');
			if (!token) throw new Error('passkeys.errors.CAPTCHA_FAILED');
			submitted = true;
			await savePasskey(password, label.trim(), credential, token);
			if (!alive) return;
			open = false;
			label = '';
			clearCeremony();
			notice = 'passkeys.added';
			await load();
		} catch (cause) {
			if (!alive) return;
			const key = passkeyErrorKey(cause);
			error = key;
			password = '';
			if (
				!['passkeys.errors.CAPTCHA_FAILED', 'passkeys.errors.INVALID_CREDENTIALS'].includes(key)
			) {
				credential = undefined;
				expiresAt = 0;
				if (submitted && key === 'passkeys.errors.failed') error = 'passkeys.errors.uncertain';
				if (!key.endsWith('cancelled')) await load();
			}
		} finally {
			turnstile?.reset();
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
			if (alive) {
				error = passkeyErrorKey(cause);
				await load();
			}
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
	><Dialog.Content class="max-h-[90dvh] overflow-y-auto p-4 sm:p-6"
		><Dialog.Header class="pr-8"
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
			><label class="block space-y-2"
				><span>{$_('passkeys.password')}</span><Input
					type="password"
					autocomplete="current-password"
					bind:value={password}
					required
					disabled={busy}
				/></label
			>
			{#if !isPasskeyMock()}<TurnstileWidget action="passkey" bind:this={turnstile} />{/if}
			{#if error}<p role="alert" class="text-sm text-destructive">{$_(error)}</p>{/if}
			<Dialog.Footer
				><Button
					type="button"
					variant="outline"
					disabled={busy}
					onclick={() => {
						open = false;
					}}>{$_('passkeys.cancel')}</Button
				><Button type="submit" disabled={busy || !available || !label.trim() || !password}
					>{busy ? $_('passkeys.waiting') : $_('passkeys.add')}</Button
				></Dialog.Footer
			>
		</form></Dialog.Content
	></Dialog.Root
>
<Dialog.Root bind:open={deleteOpen}
	><Dialog.Content class="p-4 sm:p-6"
		><Dialog.Header class="pr-8"
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
