<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- Banner destinations are API-provided internal paths or absolute URLs. */
	import { currentSession } from '$lib/auth/session';
	import { Button } from '$lib/components/ui/button';
	import XIcon from '@lucide/svelte/icons/x';
	import { currentBanners } from '$lib/banners/store';
	import { _ } from '$lib/i18n';
	import { onDestroy } from 'svelte';
	import { wikiForgeUtcDate } from '$lib/api/wikiforge-contract';
	let dismissed = $state<string[]>([]);
	let account = $state('');
	$effect(() => {
		account = String($currentSession?.user.id ?? 'anonymous');
		try {
			const saved = JSON.parse(sessionStorage.getItem('wikiforge.banners.' + account) ?? '[]');
			dismissed = Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : [];
		} catch {
			dismissed = [];
		}
	});
	function dismiss(id: number | string) {
		dismissed = [...dismissed, String(id)];
		try {
			sessionStorage.setItem('wikiforge.banners.' + account, JSON.stringify(dismissed));
		} catch {
			/* Storage is optional. */
		}
	}
	let height = $state(0);
	$effect(() => {
		document.documentElement.style.setProperty(
			'--site-banner-height',
			`${visible.length ? height : 0}px`
		);
	});
	onDestroy(() => document.documentElement.style.removeProperty('--site-banner-height'));
	let now = $state(Date.now());
	const timer = setInterval(() => (now = Date.now()), 15_000);
	onDestroy(() => clearInterval(timer));
	const visible = $derived(
		$currentBanners.filter(
			(banner) =>
				!dismissed.includes(String(banner.id)) &&
				(!banner.endsAt || wikiForgeUtcDate(banner.endsAt).getTime() > now)
		)
	);
	const tone = (level: string) =>
		level === 'CRITICAL'
			? 'border-destructive bg-destructive/10'
			: level === 'WARNING'
				? 'border-primary bg-primary/10'
				: 'border-energy/50 bg-energy/10';
</script>

{#if visible.length}<aside
		bind:clientHeight={height}
		class="sticky top-16 z-30 grid max-h-[40dvh] w-full shrink-0 gap-2 overflow-y-auto bg-background p-3 md:top-0 md:pr-44"
		aria-label={$_('banners.region')}
	>
		{#each visible as banner (banner.id)}<div
				class={`forge-panel flex flex-wrap items-center justify-between gap-3 p-3 ${tone(banner.level)}`}
			>
				<div class="min-w-0 flex-1 break-words">
					<p class="forge-label">
						{banner.title || $_('banners.announcement')} · {$_(`banners.level.${banner.level}`, {
							default: banner.level
						})}
					</p>
					<p class="mt-1 text-sm leading-relaxed">{banner.message}</p>
				</div>
				{#if banner.link}{#if banner.link.startsWith('/')}<a
							class="shrink-0 underline underline-offset-4"
							href={banner.link}>{$_('banners.open')}</a
						>{:else}<a
							class="shrink-0 underline underline-offset-4"
							href={banner.link}
							target="_blank"
							rel="noopener noreferrer">{$_('banners.openExternal')}</a
						>{/if}{/if}
				<Button
					variant="ghost"
					size="icon"
					aria-label={$_('ux.dismissBanner')}
					onclick={() => dismiss(banner.id)}><XIcon /></Button
				>
			</div>{/each}
	</aside>{/if}
