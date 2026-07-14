<script lang="ts" module>
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: "focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 aria-invalid:border-destructive rounded-none border bg-clip-padding font-sans text-[11px] font-bold tracking-[0.12em] uppercase focus-visible:ring-2 active:not-aria-[haspopup]:translate-y-px aria-invalid:ring-2 [&_svg:not([class*='size-'])]:size-4 group/button inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap transition-all duration-200 outline-none select-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			variant: {
				default:
					'border-accent bg-gradient-to-b from-primary to-accent text-primary-foreground shadow-[0_0_22px_rgb(253_121_12_/_16%)] hover:brightness-110 hover:shadow-[0_0_28px_rgb(253_121_12_/_28%)]',
				outline:
					'border-primary/45 bg-card/75 text-primary shadow-[inset_0_0_18px_rgb(25_167_170_/_5%)] hover:border-primary hover:bg-secondary hover:text-foreground aria-expanded:bg-secondary aria-expanded:text-foreground',
				secondary:
					'border-[rgb(124_228_222_/_28%)] bg-secondary text-secondary-foreground hover:border-[rgb(124_228_222_/_65%)] hover:text-[var(--energy-soft)]',
				ghost:
					'border-transparent text-muted-foreground hover:border-primary/20 hover:bg-secondary/70 hover:text-primary aria-expanded:bg-secondary aria-expanded:text-primary',
				destructive:
					'border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive hover:text-background focus-visible:ring-destructive/20',
				link: 'min-h-0 border-transparent px-0 text-primary underline-offset-4 hover:text-[var(--energy-soft)] hover:underline'
			},
			size: {
				default:
					'h-11 gap-2 px-6 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
				xs: "h-11 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
				sm: 'h-11 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
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
