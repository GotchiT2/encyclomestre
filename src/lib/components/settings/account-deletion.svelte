<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import Reauthentication from '$lib/components/security/reauthentication.svelte';
	import { getReauthentication } from '$lib/passkeys/api';
	import { passkeyErrorKey } from '$lib/passkeys/webauthn';
	import { currentSession, clearSession } from '$lib/auth/session';
	import { ApiError, disableWikiForgeSessionRefresh } from '$lib/api/client';
	import {
		getDeletionPreview,
		deleteAccount,
		checkDeletion,
		type DeletionPreview
	} from '$lib/api/account-deletion';
	import { operationError } from '$lib/domain/operation-error';
	let preview = $state<DeletionPreview>();
	let recoveryCode = $state('');
	let confirmed = $state(false);
	let busy = $state(false);
	let error = $state('');
	let uncertainToken = $state('');
	let complete = $state(false);
	function finish() {
		disableWikiForgeSessionRefresh();
		clearSession(localStorage);
		recoveryCode = '';
		uncertainToken = '';
		complete = true;
	}
	async function inspect() {
		if (busy) return;
		busy = true;
		error = '';
		try {
			preview = await getDeletionPreview();
			confirmed = false;
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}
	async function verify() {
		if (busy || !uncertainToken) return;
		busy = true;
		const state = await checkDeletion(uncertainToken);
		if (state === 'deleted') finish();
		else {
			error = $_('apiEvolution.deletion.' + state);
			if (state === 'present') uncertainToken = '';
		}
		busy = false;
	}
	async function remove() {
		if (busy || !preview?.canDelete || preview.blockers?.length || !confirmed || uncertainToken)
			return;
		const token = $currentSession?.accessToken;
		if (!token) return;
		busy = true;
		error = '';
		let submitted = false;
		try {
			const reauth = await getReauthentication(recoveryCode);
			submitted = true;
			await deleteAccount(reauth, token);
			finish();
		} catch (cause) {
			if (cause instanceof ApiError) error = operationError(cause);
			else if (submitted) uncertainToken = token;
			else error = $_(passkeyErrorKey(cause));
		} finally {
			recoveryCode = '';
			confirmed = false;
			busy = false;
		}
		if (uncertainToken) await verify();
	}
</script>

<section class="forge-panel space-y-4 border-destructive/50 p-4 sm:p-6">
	<h2 class="font-heading text-xl">{$_('apiEvolution.deletion.title')}</h2>
	<p class="text-sm text-muted-foreground">{$_('apiEvolution.deletion.help')}</p>
	{#if complete}<p role="status">{$_('apiEvolution.deletion.done')}</p>
	{:else if uncertainToken}<p role="alert">{$_('apiEvolution.deletion.unknown')}</p>
		<Button disabled={busy} onclick={verify}>{$_('apiEvolution.deletion.verify')}</Button>
	{:else}
		<Button variant="outline" disabled={busy} onclick={inspect}
			>{$_('apiEvolution.deletion.preview')}</Button
		>
		{#if preview}
			<dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
				{#each Object.entries(preview.consequences) as [key, value] (key)}<div>
						<dt class="text-muted-foreground">
							{$_('apiEvolution.deletion.consequences.' + key, { default: key })}
						</dt>
						<dd class="font-bold">{value}</dd>
					</div>{/each}
			</dl>
			{#each preview.blockers ?? [] as blocker (blocker.code + String(blocker.guildId ?? ''))}<p
					role="alert"
				>
					{$_(
						blocker.code === 'GUILD_OWNER'
							? 'apiEvolution.deletion.guildOwner'
							: 'apiEvolution.deletion.blocked'
					)}
					{blocker.guildName ?? blocker.code}
				</p>{/each}
			{#if preview.canDelete && !preview.blockers?.length}
				<Reauthentication bind:code={recoveryCode} disabled={busy} />
				<label class="flex items-start gap-3 text-sm"
					><input type="checkbox" bind:checked={confirmed} disabled={busy} class="mt-1" />{$_(
						'apiEvolution.deletion.confirm'
					)}</label
				>
				<Button variant="destructive" disabled={busy || !confirmed} onclick={remove}
					>{$_('apiEvolution.deletion.delete')}</Button
				>
			{/if}
		{/if}{/if}
	{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
</section>
