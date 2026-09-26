import { describe, expect, it } from 'vitest';
import { defaultCardSearchSort } from './search';

describe('card search defaults', () => {
	it('defaults text to relevance while preserving a later explicit sort', () => {
		expect(defaultCardSearchSort('Rose', undefined)).toBe('relevance');
		expect(defaultCardSearchSort('Rose', 'name')).toBe('name');
		expect(defaultCardSearchSort('', undefined)).toBe('name');
	});
});
