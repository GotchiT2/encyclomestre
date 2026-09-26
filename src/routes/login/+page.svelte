<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getSafeRedirectTarget } from '$lib/auth/redirect';
	import { markWikiForgeSessionVerified, persistSession } from '$lib/auth/session';
	import { ApiError, login } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import TurnstileWidget from '$lib/components/security/turnstile-widget.svelte';
	import { _ } from '$lib/i18n';

	let email = $state('');
	let password = $state('');
	let error = $state<string>();
	let isSubmitting = $state(false);
	let turnstile = $state<{ verify: () => Promise<string>; reset: () => void } | null>(null);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = undefined;
		isSubmitting = true;
		try {
			if (!turnstile) throw new Error($_('auth.login.captchaFailure'));
			const turnstileToken = await turnstile.verify();
			const session = await login({ email, password, turnstileToken });
			persistSession(localStorage, session);
			markWikiForgeSessionVerified();
			await goto(resolve(getSafeRedirectTarget(page.url.searchParams.get('redirectTo')) as '/'));
		} catch (cause) {
			const captchaRejected =
				cause instanceof ApiError &&
				typeof cause.payload === 'object' &&
				cause.payload !== null &&
				'error' in cause.payload &&
				cause.payload.error === 'invalid_captcha';
			error = captchaRejected
				? $_('auth.login.captchaFailure')
				: cause instanceof Error
					? cause.message
					: $_('auth.login.failure');
		} finally {
			turnstile?.reset();
			isSubmitting = false;
		}
	}
</script>

<section class="grid min-h-[calc(100dvh-10rem)] place-items-center py-6">
	<div class="w-full max-w-md">
		<p class="forge-wordmark mb-5 text-center text-4xl">{$_('navigation.brand')}</p>
		<Card.Root class="forge-panel w-full border-0 bg-card shadow-none">
			<Card.Header>
				<Card.Title>{$_('auth.login.title')}</Card.Title>
				<Card.Description>{$_('auth.login.description')}</Card.Description>
				<Card.Action
					><Button href="/register" variant="link">{$_('auth.login.registerLink')}</Button
					></Card.Action
				>
			</Card.Header>
			<Card.Content>
				<form onsubmit={handleSubmit}>
					<Field.Group>
						<Field.Field>
							<Field.Label for="email">{$_('auth.fields.email')}</Field.Label>
							<Input id="email" type="email" autocomplete="email" required bind:value={email} />
						</Field.Field>
						<Field.Field>
							<Field.Label for="password">{$_('auth.fields.password')}</Field.Label>
							<Input
								id="password"
								type="password"
								autocomplete="current-password"
								required
								bind:value={password}
							/>
						</Field.Field>
						<TurnstileWidget
							bind:this={turnstile}
							action="login"
							onError={() => (error = $_('auth.login.captchaFailure'))}
						/>
						{#if error}<Field.Error>{error}</Field.Error>{/if}
						<Button type="submit" class="w-full" disabled={isSubmitting}
							>{isSubmitting ? $_('auth.login.submitting') : $_('auth.login.submit')}</Button
						>
					</Field.Group>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</section>
