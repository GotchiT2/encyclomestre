<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { _ } from '$lib/i18n';
	import { exploreNavigation, transactionNavigation, isActiveRoute } from './nav-items';
	const tabs = [
		exploreNavigation[0],
		exploreNavigation[2],
		exploreNavigation[1],
		exploreNavigation[3],
		{ ...transactionNavigation[0], label: 'arcade.market' }
	];
</script>

<nav
	data-mobile-tabs
	class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
	aria-label={$_('navigation.mobileAria')}
>
	<ul class="grid grid-cols-5">
		{#each tabs as item (item.href)}
			{@const active =
				isActiveRoute(page.url.pathname, item.href) ||
				(item.href === '/market' && page.url.pathname.startsWith('/trades'))}
			<li>
				<a
					href={resolve(item.href)}
					class="flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-semibold"
					class:forge-nav-active={active}
					aria-current={active ? 'page' : undefined}
					><item.icon class="size-5" /><span>{$_(item.label)}</span></a
				>
			</li>
		{/each}
	</ul>
</nav>
