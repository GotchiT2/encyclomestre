<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Card from "$lib/components/ui/card/index.js";

	let email = $state("");
	let password = $state("");

	function handleSubmit(event: Event) {
		event.preventDefault();
		console.log("Email:", email);
		console.log("Mot de passe:", password);
	}
</script>

<Card.Root class="-my-4 w-full max-w-sm">
	<Card.Header>
		<Card.Title>Connexion à votre compte</Card.Title>
		<Card.Description>Entrez votre email ci-dessous pour vous connecter</Card.Description>
		<Card.Action>
			<a href="/register">
				<Button variant="link">Créer un compte</Button>
			</a>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleSubmit}>
			<div class="flex flex-col gap-6">
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input id="email" type="email" placeholder="m@example.com" required bind:value={email} />
				</div>
				<div class="grid gap-2">
					<div class="flex items-center">
						<Label for="password">Mot de passe</Label>
						<a
							href=""
							class="ms-auto inline-block text-sm underline-offset-4 hover:underline"
						>
							Mot de passe oublié ?
						</a>
					</div>
					<Input id="password" type="password" required bind:value={password} />
				</div>
			</div>
			<Button type="submit" class="mt-6 w-full">Se connecter</Button>
		</form>
	</Card.Content>
</Card.Root>