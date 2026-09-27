import { writable } from 'svelte/store';
import type { CardRecord } from '$lib/types';
export const openedCardLayer = writable(100);
export const openedCard = writable<CardRecord | null>(null);
let origin: HTMLElement | null = null;
export function openCardDetail(card: CardRecord) {
	origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	const layers = [...document.querySelectorAll<HTMLElement>('[role=dialog]')]
		.filter((element) => element.getClientRects().length)
		.map((element) => Number.parseInt(getComputedStyle(element).zIndex) || 0);
	openedCardLayer.set(Math.max(100, ...layers.map((layer) => layer + 10)));
	openedCard.set(card);
}
export function closeCardDetail() {
	openedCard.set(null);
	origin?.focus({ preventScroll: true });
	origin = null;
}
