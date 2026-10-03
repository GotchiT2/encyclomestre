import { MAX_RENDER_KEY } from './blueprint';
import { validateDefinition, type TemplateDefinition } from './definition';
/** Inline JSON is never case-folded, evaluated, or used as a resource URL. */
export function parseRenderKey(raw: string): TemplateDefinition | null {
	if (!raw.trim().startsWith('{')) return null;
	if (raw.length > MAX_RENDER_KEY) throw new Error('CARD_TEMPLATE_TOO_LARGE');
	return validateDefinition(JSON.parse(raw));
}
export function serializeRenderKey(definition: TemplateDefinition): string {
	const value = JSON.stringify(validateDefinition(definition));
	if (value.length > MAX_RENDER_KEY) throw new Error('CARD_TEMPLATE_TOO_LARGE');
	return value;
}
