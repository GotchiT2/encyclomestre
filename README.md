# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
pnpm dlx sv@0.16.2 create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" tailwindcss="plugins:none" --install pnpm encyclomestre
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

Le serveur local Turnstile est exposé sur `https://dev.wikiforge.fr` (port HTTPS standard,
sans `:5173`). Le fichier `hosts` du poste doit contenir `127.0.0.1 dev.wikiforge.fr`. Lors de
la première ouverture, acceptez le certificat de développement auto-signé généré par Vite.

## API WikiForge

Le frontend utilise l’API WikiForge et ses contrats OpenAPI. Créez un fichier `.env` à la racine du projet avec :

```env
PUBLIC_WIKIFORGE_API_BASE_URL=https://api.wikiforge.fr
PUBLIC_API_MOCK_ENABLED=false
```

Le Swagger est la source de vérité des contrats. Les mocks sont réservés aux tests unitaires et ne couvrent pas les parcours applicatifs complets.

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Déploiement Portainer

Le frontend est prêt pour un déploiement Node/Docker. Dans Portainer, créez une stack depuis ce dépôt avec `docker-compose.portainer.yml`, puis renseignez les variables du fichier `.env.production.example`.

- Définissez `ORIGIN=https://www.wikiforge.fr`, `PUBLIC_WIKIFORGE_API_BASE_URL=https://api.wikiforge.fr` et `FRONTEND_PORT=32000`. L'API doit autoriser `https://www.wikiforge.fr` dans sa configuration CORS.

Le proxy du NAS doit envoyer le domaine du frontend vers le port `3000` du conteneur. Ne publiez pas ce port directement sur Internet.

### TrueNAS sans build Portainer

Utilisez `docker-compose.truenas.yml` si Portainer échoue avant la lecture du Dockerfile. Cette stack n'utilise pas `build:` : elle récupère ce dépôt au démarrage, exécute `npm ci`, construit SvelteKit puis démarre le serveur Node avec le port NAS `32000`.

## DA

### Colors

- Dark blue : #080f19
- Blue : #0a1422
- Yellow : #feb823
- Orange : #fd790c
- Commune : #d3e4f8
- Peu Commune : #1d71cf
- Rare : #5c1dcf
- Super Rare : #b41dcf
- Ultra Rare : #cf7d1d
- Légendaire : #cf1d1d

### Typos

- Logo : DBacks Regular
- Titles : Palatino Linotype Bold
- Texts : Lato Regular
