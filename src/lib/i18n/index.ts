import { addMessages, init, locale, _ } from 'svelte-i18n';
import fr from '$lib/locales/fr.json';

addMessages('fr', fr);

init({
	fallbackLocale: 'fr',
	initialLocale: 'fr'
});

export { _, locale };
