<script lang="ts">
	import { onDestroy } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { _ } from '$lib/i18n';
	import { getSafeRedirectTarget } from '$lib/auth/redirect';
	import { persistSession, markWikiForgeSessionVerified } from '$lib/auth/session';
	import {
		getSignupOptions,
		getRecoveryOptions,
		finishPasskeyCeremony,
		isPasskeyMock,
		PasskeyFinalizationError
	} from '$lib/passkeys/api';
	import { finalizeOAuthLogin } from '$lib/api/auth';
	import { registerPasskey, cancelPasskey, passkeyErrorKey } from '$lib/passkeys/webauthn';
	import type { AuthSession, OAuth2TokenResponse } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import TurnstileWidget from './turnstile-widget.svelte';
	import RecoveryCodes from './recovery-codes.svelte';
	import LegalLinks from './legal-links.svelte';
	let { recovery = false }: { recovery?: boolean } = $props();
	let name = $state('');
	let code = $state('');
	let busy = $state(false);
	let error = $state('');
	let codes = $state<string[]>([]);
	let session: AuthSession | undefined;
	let pendingTokens = $state<OAuth2TokenResponse>();
	const token = $derived(page.url.searchParams.get('token'));
	let turnstile = $state<{ verify: () => Promise<string>; reset: () => void } | null>(null);
	const abort = new AbortController();
	let alive = true;
	onDestroy(() => {
		alive = false;
		abort.abort();
		cancelPasskey();
		codes = [];
		session = undefined;
		pendingTokens = undefined;
	});
	async function enter() {
		try {
			if (!session && pendingTokens)
				session = await finalizeOAuthLogin(pendingTokens, { signal: abort.signal });
			if (!session || !alive) return;
			persistSession(localStorage, session);
			markWikiForgeSessionVerified();
			codes = [];
			pendingTokens = undefined;
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- redirect is a validated same-origin URL supplied by the access guard
			await goto(getSafeRedirectTarget(page.url.searchParams.get('redirectTo')));
		} catch {
			error = 'passkeys.errors.finalize';
		}
	}
	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		busy = true;
		error = '';
		try {
			const captcha = recovery && token ? undefined : await turnstile?.verify();
			if ((!recovery || !token) && !captcha) throw new Error('passkeys.errors.CAPTCHA_FAILED');
			const ceremony = recovery
				? await getRecoveryOptions(token ? { token } : { name: name.trim(), code }, captcha)
				: await getSignupOptions(name.trim(), captcha!);
			if (!alive) return;
			const credential = await registerPasskey(ceremony.options);
			const result = await finishPasskeyCeremony(ceremony.requestId, credential, abort.signal);
			if (!alive) return;
			session = result.session;
			codes = result.recoveryCodes;
			code = '';
			if (!codes.length) await enter();
		} catch (cause) {
			if (alive) {
				error = passkeyErrorKey(cause);
				if (cause instanceof PasskeyFinalizationError) {
					pendingTokens = cause.tokens;
					codes = cause.tokens.recovery_codes ?? [];
					code = '';
				}
			}
		} finally {
			turnstile?.reset();
			if (alive) busy = false;
		}
	}
</script>

<section class="mx-auto w-full max-w-lg space-y-6 py-8">
	{#if !recovery}<ol
			class="grid grid-cols-4 gap-1 border-b border-border pb-4 text-xs"
			aria-label={$_('arcade.accountSteps')}
		>
			{#each ['stepName', 'stepPasskey', 'stepCodes', 'stepCollection'] as step, index (step)}<li
					class="grid gap-2"
					class:text-primary={(codes.length ? 2 : busy ? 1 : 0) === index}
					aria-current={(codes.length ? 2 : busy ? 1 : 0) === index ? 'step' : undefined}
				>
					<span class="font-heading text-2xl font-black">0{index + 1}</span><span
						>{$_('arcade.' + step)}</span
					>
				</li>{/each}
		</ol>{/if}
	<div class="forge-panel space-y-5 border bg-card p-4 sm:p-6">
		{#if codes.length}<RecoveryCodes {codes} onDone={enter} />{#if error}<p role="alert">
					{$_(error)}
				</p>{/if}{:else if pendingTokens}<p role="alert">{$_('passkeys.errors.finalize')}</p>
			<Button onclick={enter}>{$_('completion.retry')}</Button>{:else}
			<h1 class="text-4xl font-black">
				{$_(recovery ? 'plan.account.recoverTitle' : 'plan.account.signupTitle')}
			</h1>
			<p class="text-sm text-muted-foreground">
				{$_(
					recovery
						? token
							? 'plan.account.linkRecovery'
							: 'plan.account.codeRecovery'
						: 'plan.account.signupInfo'
				)}
			</p>
			<form class="space-y-4" onsubmit={submit}>
				{#if !recovery || !token}<label class="block space-y-2"
						><span>{$_('plan.account.name')}</span><Input
							bind:value={name}
							maxlength={64}
							autocomplete="username"
							required
							disabled={busy}
						/></label
					>{/if}
				{#if recovery && !token}<label class="block space-y-2"
						><span>{$_('plan.account.code')}</span><Input
							bind:value={code}
							type="password"
							autocomplete="off"
							required
							disabled={busy}
						/></label
					>{/if}
				{#if !recovery || !token}<TurnstileWidget
						mock={isPasskeyMock()}
						bind:this={turnstile}
						action={recovery ? 'recovery' : 'signup'}
					/>{/if}
				{#if error}<p role="alert" class="text-sm text-destructive">{$_(error)}</p>{/if}
				<Button type="submit" class="w-full" disabled={busy}
					>{$_(busy ? 'passkeys.waiting' : 'plan.account.createPasskey')}</Button
				>
			</form>
			<Button href="/login" variant="link">{$_('plan.account.login')}</Button>
		{/if}
	</div>
	<LegalLinks />
</section>
