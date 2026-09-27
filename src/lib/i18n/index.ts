import { addMessages, init, locale, _ } from 'svelte-i18n';
import fr from '$lib/locales/fr.json';
import completion from '$lib/locales/completion.fr.json';

addMessages('fr', fr);
addMessages('fr', completion);

init({
	fallbackLocale: 'fr',
	initialLocale: 'fr'
});

export { _, locale };
