import { redirect } from '@sveltejs/kit';

/** Les enchères ne sont pas encore exposées par l’API WikiForge. */
export const load = () => redirect(307, '/cards');
