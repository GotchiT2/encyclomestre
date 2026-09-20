export const CARD_PLACEHOLDER_URL = '/card-placeholder.svg';

export function hasUsableCardImage(url: string | null | undefined): url is string {
	const value = url?.trim();
	return Boolean(value && value !== CARD_PLACEHOLDER_URL);
}

export function isLandscapeCardImage(width: number, height: number): boolean {
	return width > 0 && height > 0 && width / height >= 1.2;
}
