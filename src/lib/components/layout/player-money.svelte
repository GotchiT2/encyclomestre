<script lang="ts">
	import { currentSession } from '$lib/auth/session';
	import { _ } from '$lib/i18n';
	import CoinsIcon from '@lucide/svelte/icons/coins';
</script>

{#if $currentSession}
	<span
		class="inline-flex h-9 items-center gap-1.5 border border-primary/35 bg-background/85 px-2.5 font-sans text-sm font-bold text-primary shadow-[0_8px_22px_rgb(0_0_0_/_22%)]"
		aria-label={$_('navigation.money_balance', {
			values: { amount: $currentSession.user.money ?? 0 }
		})}
		aria-live="polite"
	>
		<CoinsIcon class="size-4" aria-hidden="true" />
		{$currentSession.user.money ?? 0}
	</span>
{/if}
