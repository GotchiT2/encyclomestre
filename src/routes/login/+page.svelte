<script lang="ts">
	import PasskeyLogin from '$lib/components/security/passkey-login.svelte';
	import LegalLinks from '$lib/components/security/legal-links.svelte';
	import type { AuthSession } from '$lib/types';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getSafeRedirectTarget } from '$lib/auth/redirect';
	import { markWikiForgeSessionVerified, persistSession } from '$lib/auth/session';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	let busy = $state(false);
	async function acceptSession(session: AuthSession) {
		persistSession(localStorage, session);
		markWikiForgeSessionVerified();
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- redirect is a validated same-origin URL supplied by the access guard
		await goto(getSafeRedirectTarget(page.url.searchParams.get('redirectTo')));
	}
</script>

<section class="mx-auto grid min-h-[calc(100dvh-10rem)] w-full max-w-md content-center gap-6 py-6">
	<p class="forge-wordmark text-center text-4xl">{$_('navigation.brand')}</p>
	<div class="forge-panel space-y-4 rounded-lg bg-card p-4 sm:p-6">
		<h1 class="text-2xl font-semibold">{$_('auth.login.title')}</h1>
		<p class="text-sm text-muted-foreground">{$_('plan.account.loginInfo')}</p>
		<PasskeyLogin bind:busy onSuccess={acceptSession} />
		<div class="flex flex-wrap gap-2">
			<Button href="/register" variant="link">{$_('auth.login.registerLink')}</Button><Button
				href="/recovery"
				variant="link">{$_('plan.account.recover')}</Button
			>
		</div>
	</div>
	<LegalLinks />
</section>
