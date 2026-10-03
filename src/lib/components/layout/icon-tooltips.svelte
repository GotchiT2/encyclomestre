<script lang="ts">
	import { onMount } from 'svelte';
	let target = $state<HTMLElement | null>(null);
	let label = $state('');
	let hint = $state<HTMLDivElement>();
	let position = $state<{ left: number; top: number }>();
	let timer: ReturnType<typeof setTimeout> | undefined;
	const id = $props.id();
	function close() {
		clearTimeout(timer);
		if (target) {
			const description = target
				.getAttribute('aria-describedby')
				?.split(' ')
				.filter((value) => value !== id)
				.join(' ');
			if (description) target.setAttribute('aria-describedby', description);
			else target.removeAttribute('aria-describedby');
		}
		target = null;
		label = '';
		position = undefined;
	}
	function show(element: HTMLElement, delay: number) {
		close();
		const text = element.dataset.tooltip ?? element.getAttribute('aria-label');
		if (!text) return;
		timer = setTimeout(() => {
			if (!element.isConnected) return;
			target = element;
			label = text;
			element.setAttribute(
				'aria-describedby',
				[element.getAttribute('aria-describedby'), id].filter(Boolean).join(' ')
			);
		}, delay);
	}
	function action(eventTarget: EventTarget | null) {
		const element =
			eventTarget instanceof Element
				? eventTarget.closest<HTMLElement>(
						'[data-tooltip], button[aria-label], a[aria-label], [role=button][aria-label]'
					)
				: null;
		if (!element) return null;
		// Labelled icon and numeric controls share one lazy tooltip, without adding wrappers.
		return element.dataset.tooltip ||
			!element.textContent?.trim() ||
			/^[\d\s×♥↑↔↓→←⋯]+$/.test(element.textContent.trim())
			? element
			: null;
	}
	$effect(() => {
		if (!target || !hint) return;
		void label;
		const box = hint.getBoundingClientRect(),
			anchor = target.getBoundingClientRect();
		position = {
			left: Math.max(
				8,
				Math.min(innerWidth - box.width - 8, anchor.x + anchor.width / 2 - box.width / 2)
			),
			top:
				anchor.top - box.height - 8 >= 8
					? anchor.top - box.height - 8
					: Math.min(innerHeight - box.height - 8, anchor.bottom + 8)
		};
	});
	onMount(() => {
		let touch = false;
		const pointer = (event: PointerEvent) => {
			if (event.pointerType === 'touch') return;
			const element = action(event.target);
			if (element && !element.contains(event.relatedTarget as Node | null)) show(element, 250);
		};
		const leave = (event: PointerEvent) => {
			const element = action(event.target);
			if (element && !element.contains(event.relatedTarget as Node | null)) close();
		};
		// Focus can move while Svelte removes a selected card. Defer state writes out of that render.
		const focus = (event: FocusEvent) => {
			const element = action(event.target);
			if (!touch && element)
				queueMicrotask(() => {
					if (element.isConnected && document.activeElement === element) show(element, 0);
				});
		};
		const blur = () =>
			queueMicrotask(() => {
				if (!action(document.activeElement)) close();
			});
		const press = (event: PointerEvent) => {
			touch = event.pointerType === 'touch';
			close();
		};
		const key = (event: KeyboardEvent) => {
			touch = false;
			if (event.key === 'Escape') close();
		};
		document.addEventListener('pointerover', pointer);
		document.addEventListener('pointerout', leave);
		document.addEventListener('focusin', focus);
		document.addEventListener('focusout', blur);
		document.addEventListener('pointerdown', press);
		document.addEventListener('keydown', key);
		document.addEventListener('scroll', close, true);
		window.addEventListener('resize', close);
		return () => {
			clearTimeout(timer);
			document.removeEventListener('pointerover', pointer);
			document.removeEventListener('pointerout', leave);
			document.removeEventListener('focusin', focus);
			document.removeEventListener('focusout', blur);
			document.removeEventListener('pointerdown', press);
			document.removeEventListener('keydown', key);
			document.removeEventListener('scroll', close, true);
			window.removeEventListener('resize', close);
		};
	});
</script>

{#if label}<div
		bind:this={hint}
		{id}
		role="tooltip"
		data-testid="icon-tooltip"
		style:left={`${position?.left ?? 0}px`}
		style:top={`${position?.top ?? 0}px`}
		style:visibility={position ? 'visible' : 'hidden'}
	>
		{label}
	</div>{/if}

<style>
	div {
		position: fixed;
		z-index: 2147483000;
		pointer-events: none;
		max-width: min(320px, calc(100vw - 16px));
		padding: 8px 12px;
		border: 1px solid var(--primary);
		background: var(--foreground);
		color: var(--background);
		font:
			500 13px/1.4 'Barlow',
			sans-serif;
		overflow-wrap: anywhere;
		box-shadow: 0 4px 16px #0005;
	}
</style>
