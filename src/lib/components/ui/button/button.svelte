<script lang="ts" module>
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: "focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 aria-invalid:border-destructive rounded-none border bg-clip-padding font-sans text-sm font-semibold tracking-normal focus-visible:ring-2 active:not-aria-[haspopup]:translate-y-px aria-invalid:ring-2 [&_svg:not([class*='size-'])]:size-4 group/button inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-normal transition-colors duration-150 outline-none select-none disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			variant: {
				default: 'border-primary bg-primary text-primary-foreground hover:brightness-110',
				outline:
					'border-border bg-card text-foreground hover:border-primary hover:bg-secondary aria-expanded:border-primary',
				secondary: 'border-border bg-secondary text-secondary-foreground hover:border-primary',
				ghost:
					'border-transparent text-muted-foreground hover:border-primary/20 hover:bg-secondary/70 hover:text-primary aria-expanded:bg-secondary aria-expanded:text-primary',
				destructive:
					'border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive hover:text-background focus-visible:ring-destructive/20',
				link: 'min-h-11 border-transparent px-0 text-primary underline-offset-4 hover:text-[var(--energy-soft)] hover:underline'
			},
			size: {
				default:
					'min-h-11 gap-2 px-4 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
				xs: "min-h-11 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
				sm: 'min-h-11 gap-1.5 px-3 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
				lg: 'h-12 gap-2 px-8 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5',
				icon: 'size-11',
				'icon-xs': "size-11 [&_svg:not([class*='size-'])]:size-3.5",
				'icon-sm': 'size-11',
				'icon-lg': 'size-12'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- external links intentionally bypass SvelteKit resolution */
	import { resolve } from '$app/paths';

	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();

	const isExternalHref = (value: string | undefined) =>
		Boolean(value && /^https?:\/\//i.test(value));
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : isExternalHref(href) ? href : resolve(href as '/')}
		aria-disabled={disabled}
		role={disabled ? 'link' : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
