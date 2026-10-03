<script lang="ts">
	import { Portal } from 'bits-ui';
	import type { Snippet } from 'svelte';
	let { children }: { children: Snippet } = $props();
	let slot: HTMLDivElement;
	let height = $state(0);
	let placement = $state('');
	let ready = $state(false);
	// Keep one mounted form across breakpoints, outside any animated ancestor.
	function measure(node: HTMLElement) {
		const nav = document.querySelector<HTMLElement>('[data-mobile-tabs]');
		let frame = 0;
		const update = () => {
			frame = 0;
			const rect = slot.getBoundingClientRect();
			const viewport = window.visualViewport;
			const visibleHeight = viewport?.height ?? innerHeight;
			const keyboardLift = Math.max(0, innerHeight - visibleHeight - (viewport?.offsetTop ?? 0));
			const top = Math.max(88, rect.top);
			placement = `--dock-left:${rect.left}px;--dock-width:${rect.width}px;--dock-top:${top}px;--dock-nav:${nav?.getBoundingClientRect().height ?? 0}px;--dock-visible:${visibleHeight}px;--dock-keyboard:${keyboardLift}px`;
			height = node.getBoundingClientRect().height;
			ready = true;
		};
		const queue = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		const observer = new ResizeObserver(queue);
		observer.observe(node);
		observer.observe(slot);
		if (nav) observer.observe(nav);
		window.addEventListener('scroll', queue, { passive: true });
		window.addEventListener('resize', queue);
		window.visualViewport?.addEventListener('resize', queue);
		window.visualViewport?.addEventListener('scroll', queue);
		update();
		return {
			destroy() {
				observer.disconnect();
				cancelAnimationFrame(frame);
				window.removeEventListener('scroll', queue);
				window.removeEventListener('resize', queue);
				window.visualViewport?.removeEventListener('resize', queue);
				window.visualViewport?.removeEventListener('scroll', queue);
			}
		};
	}
</script>

<div
	bind:this={slot}
	class="dock-slot"
	style={`--dock-height:${height}px`}
	aria-hidden="true"
></div>
<Portal>
	<aside use:measure class="auction-dock" class:ready style={placement} data-testid="auction-dock">
		{@render children()}
	</aside>
</Portal>

<style>
	.dock-slot {
		min-width: 0;
		height: var(--dock-height);
	}
	.auction-dock {
		position: fixed;
		z-index: 40;
		inset-inline: 0;
		bottom: calc(var(--dock-nav, 64px) + var(--dock-keyboard, 0px));
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 12px;
		background: var(--card);
		color: var(--foreground);
		border: 1px solid var(--border);
		box-shadow: 0 -8px 24px #0005;
		visibility: hidden;
		max-height: calc(var(--dock-visible, 100dvh) - var(--dock-nav, 64px) - 72px);
		overflow-y: auto;
		overscroll-behavior: contain;
		scroll-padding: 12px;
	}
	.ready {
		visibility: visible;
	}
	@media (min-width: 1024px) {
		.auction-dock {
			left: var(--dock-left);
			right: auto;
			width: var(--dock-width);
			top: var(--dock-top);
			bottom: auto;
			padding: 20px;
			max-height: calc(var(--dock-visible, 100dvh) - var(--dock-top) - 16px);
			box-shadow: none;
			gap: 16px;
		}
	}
</style>
