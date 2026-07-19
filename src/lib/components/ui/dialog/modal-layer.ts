import { getContext, setContext } from 'svelte';

const modalLayerContext = Symbol('encyclomestre-modal-layer');
const baseModalLayer = 50;
const modalLayerStep = 10;

export function createModalLayer(explicitLayer?: number): number {
	const parentLayer = getContext<number | undefined>(modalLayerContext);
	const layer = explicitLayer ?? (parentLayer ?? baseModalLayer - modalLayerStep) + modalLayerStep;
	setContext(modalLayerContext, layer);
	return layer;
}

export function modalZIndex(layer: number, style?: unknown): string {
	const customStyle = typeof style === 'string' ? style : '';
	return `z-index:${layer};${customStyle}`;
}
