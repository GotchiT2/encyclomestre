<script lang="ts">
	import { resolve } from '$app/paths';
	import { _ } from '$lib/i18n';
</script>

<nav
	aria-label={$_('plan.legal.navigation')}
	class="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground"
>
	<a href={resolve('/legal')} class="underline">{$_('plan.legal.legal')}</a><a
		href={resolve('/privacy')}
		class="underline">{$_('plan.legal.privacy')}</a
	><a href={resolve('/terms')} class="underline">{$_('plan.legal.terms')}</a>
</nav>
