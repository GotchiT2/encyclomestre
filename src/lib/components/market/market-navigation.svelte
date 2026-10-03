<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { _ } from '$lib/i18n';
</script>

<nav class="market-navigation" aria-label={$_('arcade.market')}>
	<a
		href={resolve('/market')}
		aria-current={page.url.pathname.startsWith('/market') ? 'page' : undefined}
		>{$_('navigation.auctions')}</a
	><a
		href={resolve('/trades')}
		aria-current={page.url.pathname.startsWith('/trades') ? 'page' : undefined}
		>{$_('navigation.trades')}</a
	>
</nav>

<style>
	.market-navigation {
		display: flex;
		border-bottom: 1px solid var(--border);
		margin-bottom: 1.25rem;
		gap: 0.5rem;
	}
	.market-navigation a {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0.6rem 1rem;
		border: 1px solid transparent;
		font-weight: 600;
	}
	.market-navigation a[aria-current='page'] {
		color: var(--primary);
		border-bottom: 3px solid var(--primary);
	}
	.market-navigation a:focus-visible {
		outline-offset: -3px;
	}
</style>
