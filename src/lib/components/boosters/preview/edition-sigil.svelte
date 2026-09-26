<script lang="ts">
	let { key, class: className }: { key: string; class?: string } = $props();
</script>

<svg
	class={className}
	data-sigil={key}
	viewBox="0 0 64 64"
	fill="none"
	stroke="currentColor"
	stroke-linecap="square"
	stroke-linejoin="miter"
	aria-hidden="true"
>
	{#if key === 'standard'}
		<path
			d="M35 7c2 11-7 14-2 23 2 4 7 5 9 1 2 12-2 23-12 26-10-5-15-14-11-24 3-8 10-12 12-21 4 5 3 10 4 14 5-6 4-12 0-19Z"
		/>
	{:else if key === 'full-art'}
		<path d="m32 7 22 25-22 25L10 32 32 7Z" /><path d="m32 16 14 16-14 16-14-16 14-16Z" />
	{:else if key === 'chrome'}
		<path d="m32 6 22 15-8 29-28 8L7 29 32 6Z" /><path d="M7 29h39L32 6v52m14-8L18 21" />
	{:else if key === 'nebula'}
		<circle cx="32" cy="32" r="13" /><ellipse
			cx="32"
			cy="32"
			rx="28"
			ry="9"
			transform="rotate(-24 32 32)"
		/><circle cx="51" cy="11" r="2" fill="currentColor" stroke="none" />
	{:else if key === 'arcade'}
		<path d="M25 8h14v17h17v14H39v17H25V39H8V25h17V8Z" /><path
			d="M12 12h9m-9 0v9M52 52h-9m9 0v-9"
		/>
	{:else if key === 'neon'}
		<path d="m37 5-23 32h17l-4 22 24-35H35l2-19Z" /><path d="M8 9v46h48V9" opacity=".38" />
	{:else}
		<path
			d="m32 4 6 13 13-7-2 15 15 3-12 10 7 13-15-1-4 14-10-12-13 8 1-15-14-4 12-9-8-13 15 2L32 4Z"
		/><path d="m32 19-3 15h7l-4 12" stroke-width="3" />
	{/if}
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: 100%;
		stroke-width: 2;
		vector-effect: non-scaling-stroke;
	}
</style>
