<script lang="ts">
	import { resolve } from '$app/paths';
	import { currentSession } from '$lib/auth/session';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { _ } from '$lib/i18n';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import PlayerMoney from './player-money.svelte';
</script>

<!-- La barre d'onglets couvre les destinations principales : ce bandeau ne porte que
     l'identité et l'accès au tiroir de navigation complet. -->
<header
	class="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-2 border-b border-primary/20 bg-background/88 px-3 backdrop-blur-xl md:hidden"
>
	{#if $currentSession}
		<Sidebar.Trigger
			class="size-10 border border-primary/35 text-primary"
			aria-label={$_('navigation.openMenu')}
		/>
	{/if}
	<a href={resolve('/')} class="min-w-0 flex-1" aria-label={$_('navigation.home')}>
		<span class="forge-wordmark block truncate text-lg leading-none">{$_('navigation.brand')}</span>
	</a>
	<PlayerMoney />
	<a
		href={$currentSession ? resolve('/profile') : resolve('/login')}
		class="grid size-10 shrink-0 place-items-center border border-primary/35 text-primary"
		aria-label={$currentSession ? $_('navigation.profile') : $_('navigation.login')}
	>
		{#if $currentSession}<UserRoundIcon class="size-5" />{:else}<LogInIcon class="size-5" />{/if}
	</a>
</header>
