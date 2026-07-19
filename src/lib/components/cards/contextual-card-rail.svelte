<script lang="ts" generics="T">
	import { onMount } from 'svelte';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import type { EmblaCarouselType } from 'embla-carousel';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		items,
		label,
		itemKey,
		children,
		class: className,
		desktopGridClass = 'lg:grid-cols-4'
	}: {
		items: T[];
		label: string;
		itemKey: (item: T, index: number) => string;
		children: Snippet<[T, number]>;
		class?: string;
		desktopGridClass?: string;
	} = $props();

	let mobile = $state(false);
	let api = $state<EmblaCarouselType>();
	let selectedIndex = $state(0);
	let canScrollPrevious = $state(false);
	let canScrollNext = $state(false);
	const options = $derived({
		active: mobile,
		align: 'start' as const,
		containScroll: 'trimSnaps' as const,
		dragFree: true
	});

	function updateNavigation() {
		if (!api) return;
		selectedIndex = api.selectedScrollSnap();
		canScrollPrevious = api.canScrollPrev();
		canScrollNext = api.canScrollNext();
	}

	function handleInit(event: CustomEvent<EmblaCarouselType>) {
		api = event.detail;
		api.on('select', updateNavigation);
		api.on('reInit', updateNavigation);
		updateNavigation();
	}

	onMount(() => {
		const media = window.matchMedia('(max-width: 1023px)');
		const update = () => (mobile = media.matches);
		update();
		media.addEventListener('change', update);
		return () => media.removeEventListener('change', update);
	});
</script>

<section class={cn('min-w-0', className)} aria-label={label} data-testid="contextual-card-rail">
	<div
		class="min-w-0 overflow-hidden lg:overflow-visible"
		use:emblaCarouselSvelte={{ options, plugins: [] }}
		onemblaInit={handleInit}
	>
		<div class={cn('-ml-3 flex touch-pan-y lg:ml-0 lg:grid lg:gap-3', desktopGridClass)}>
			{#each items as item, index (itemKey(item, index))}
				<div
					class="min-w-0 basis-[72%] shrink-0 grow-0 pl-3 min-[390px]:basis-[64%] sm:basis-[46%] lg:basis-auto lg:pl-0"
				>
					{@render children(item, index)}
				</div>
			{/each}
		</div>
	</div>

	{#if mobile && items.length > 1}
		<div class="mt-3 flex min-h-11 items-center justify-center gap-3">
			<Button
				size="icon-sm"
				variant="outline"
				disabled={!canScrollPrevious}
				onclick={() => api?.scrollPrev()}
				aria-label={$_('common.previous')}
			>
				<ChevronLeftIcon />
			</Button>
			<span
				class="min-w-16 text-center font-mono text-[10px] uppercase tracking-widest text-primary"
			>
				{selectedIndex + 1} / {items.length}
			</span>
			<Button
				size="icon-sm"
				variant="outline"
				disabled={!canScrollNext}
				onclick={() => api?.scrollNext()}
				aria-label={$_('common.next')}
			>
				<ChevronRightIcon />
			</Button>
		</div>
	{/if}
</section>
