export function normalizePackSearch(value: string) {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLocaleLowerCase('fr');
}

export function filterPackPool<T>(items: T[], query: string, title: (item: T) => string): T[] {
	const needle = normalizePackSearch(query.trim());
	return needle ? items.filter((item) => normalizePackSearch(title(item)).includes(needle)) : [];
}
