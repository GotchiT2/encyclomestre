<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { hydrateSession } from '$lib/auth/session';
	import { _ } from '$lib/i18n';
	import { onMount, type Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
	let isAuthorized = $state(false);

	onMount(async () => {
		if (!hydrateSession(localStorage)) {
			const redirectTo = `${page.url.pathname}${page.url.search}`;
			await goto(resolve(`/login?redirectTo=${encodeURIComponent(redirectTo)}` as '/'));
			return;
		}
		isAuthorized = true;
	});
</script>

{#if isAuthorized}
	{@render children()}
{:else}
	<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
		{$_('auth.guard.loading')}
	</p>
{/if}
