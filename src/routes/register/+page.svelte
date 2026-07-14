<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { register } from '$lib/api';
	import { persistSession } from '$lib/auth/session';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';

	let username = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state<string>();
	let isSubmitting = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = undefined;
		isSubmitting = true;
		try {
			const tokens = await register({ email, password });
			persistSession(localStorage, {
				...tokens,
				user: {
					id: email,
					username,
					displayName: username,
					role: 'user',
					createdAt: '',
					updatedAt: ''
				}
			});
			await goto(resolve('/'));
		} catch (cause) {
			error = cause instanceof Error ? cause.message : $_('auth.register.failure');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<section class="grid min-h-[calc(100dvh-10rem)] place-items-center py-6">
	<div class="w-full max-w-md">
		<p class="forge-wordmark mb-5 text-center text-4xl">{$_('navigation.brand')}</p>
		<Card.Root class="forge-panel w-full border-0 bg-card shadow-none">
			<Card.Header>
				<Card.Title>{$_('auth.register.title')}</Card.Title>
				<Card.Description>{$_('auth.register.description')}</Card.Description>
				<Card.Action
					><Button href="/login" variant="link">{$_('auth.register.loginLink')}</Button
					></Card.Action
				>
			</Card.Header>
			<Card.Content>
				<form onsubmit={handleSubmit}>
					<Field.Group>
						<Field.Field>
							<Field.Label for="username">{$_('auth.fields.username')}</Field.Label>
							<Input
								id="username"
								autocomplete="username"
								required
								minlength={3}
								bind:value={username}
							/>
						</Field.Field>
						<Field.Field>
							<Field.Label for="email">{$_('auth.fields.email')}</Field.Label>
							<Input id="email" type="email" autocomplete="email" required bind:value={email} />
						</Field.Field>
						<Field.Field>
							<Field.Label for="password">{$_('auth.fields.password')}</Field.Label>
							<Input
								id="password"
								type="password"
								autocomplete="new-password"
								required
								minlength={8}
								bind:value={password}
							/>
							<Field.Description>{$_('auth.register.passwordHint')}</Field.Description>
						</Field.Field>
						{#if error}<Field.Error>{error}</Field.Error>{/if}
						<Button type="submit" class="w-full" disabled={isSubmitting}
							>{isSubmitting ? $_('auth.register.submitting') : $_('auth.register.submit')}</Button
						>
					</Field.Group>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</section>
