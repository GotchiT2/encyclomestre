<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { Button } from '$lib/components/ui/button';
	import { getAuthenticationOptions, finishPasskeyLogin } from '$lib/passkeys/api';
	import {
		authenticatePasskey,
		cancelPasskey,
		passkeyAvailable,
		passkeyErrorKey
	} from '$lib/passkeys/webauthn';
	let {
		busy = $bindable(false),
		onSuccess
	}: {
		busy?: boolean;
		onSuccess: (session: Awaited<ReturnType<typeof finishPasskeyLogin>>) => void | Promise<void>;
	} = $props();
	let available = $state(false);
	let unavailableKey = $state('passkeys.errors.unsupported');
	let error = $state('');
	let own = false;
	let alive = true;
	const controller = new AbortController();
	onMount(() => {
		available = passkeyAvailable();
		unavailableKey = window.isSecureContext
			? 'passkeys.errors.unsupported'
			: 'passkeys.errors.insecure';
	});
	onDestroy(() => {
		alive = false;
		controller.abort();
		if (own) cancelPasskey();
	});
	async function connect() {
		if (busy || !available) return;
		busy = true;
		own = true;
		error = '';
		try {
			const data = await getAuthenticationOptions(controller.signal);
			if (!alive) return;
			const credential = await authenticatePasskey(data.options);
			if (!alive) return;
			const session = await finishPasskeyLogin(data.requestId, credential, controller.signal);
			if (alive) await onSuccess(session);
		} catch (cause) {
			if (alive) error = passkeyErrorKey(cause);
		} finally {
			own = false;
			if (alive) busy = false;
		}
	}
</script>

<div class="mt-4 space-y-2 border-t border-border pt-4">
	<Button
		type="button"
		variant="outline"
		class="w-full whitespace-normal"
		disabled={busy || !available}
		onclick={connect}>{$_('passkeys.login')}</Button
	>
	<p class="text-sm text-muted-foreground">{$_('passkeys.loginHint')}</p>
	{#if !available}<p class="text-sm text-muted-foreground">
			{$_(unavailableKey)}
		</p>{/if}
	{#if error}<p role="alert" class="text-sm text-destructive">{$_(error)}</p>{/if}
</div>
