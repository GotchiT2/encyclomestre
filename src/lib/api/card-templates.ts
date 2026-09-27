import { apiRequest, isMockApiEnabled } from './client';
import { createMockCatalogue, createTemplateLoader } from '$lib/card-renderer/catalogue';
const mock = createMockCatalogue();
const loader = createTemplateLoader((id, revision) =>
	isMockApiEnabled()
		? mock.read(id, revision)
		: apiRequest(`/card-templates/${encodeURIComponent(id)}/versions/${revision}`, {
				apiTarget: 'wikiforge'
			})
);
export const getCardTemplate = (key: string) => loader.load(key);
export const resetCardTemplateCache = () => loader.clear();
export const getCardTemplateCatalogue = () =>
	isMockApiEnabled()
		? mock.publicList()
		: apiRequest('/card-templates', { apiTarget: 'wikiforge' });
