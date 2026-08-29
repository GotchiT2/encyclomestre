<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { _ } from '$lib/i18n';
	import { isActiveRoute, mobileTabsAfter, mobileTabsBefore, type NavItem } from './nav-items';
	import PackageOpenIcon from '@lucide/svelte/icons/package-open';
</script>

{#snippet tab(item: NavItem)}
	<li>
		<a
			href={resolve(item.href)}
			class="flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 text-[9px] leading-none font-bold text-muted-foreground uppercase"
			class:forge-nav-active={isActiveRoute(page.url.pathname, item.href)}
			aria-current={isActiveRoute(page.url.pathname, item.href) ? 'page' : undefined}
		>
			<item.icon class="size-5" />
			<span class="max-w-full truncate">{$_(item.label)}</span>
		</a>
	</li>
{/snippet}

<nav
	class="fixed inset-x-0 bottom-0 z-40 border-t border-primary/25 bg-background/94 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
	aria-label={$_('navigation.mobileAria')}
>
	<ul class="grid grid-cols-[1fr_1fr_3.5rem_1fr_1fr] items-end">
		{#each mobileTabsBefore as item (item.href)}
			{@render tab(item)}
		{/each}

		<li class="relative min-h-16">
			<a
				href={resolve('/boosters')}
				class="absolute -top-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1"
				aria-current={isActiveRoute(page.url.pathname, '/boosters') ? 'page' : undefined}
			>
				<span
					class="forge-tab-booster"
					class:forge-tab-booster-active={isActiveRoute(page.url.pathname, '/boosters')}
					><PackageOpenIcon class="size-7" /></span
				>
				<span class="text-[9px] leading-none font-bold text-primary uppercase">
					{$_('navigation.boosters')}
				</span>
			</a>
		</li>

		{#each mobileTabsAfter as item (item.href)}
			{@render tab(item)}
		{/each}
	</ul>
</nav>
