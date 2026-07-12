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

## API mock

Le client API peut intercepter tous les appels avant qu'ils ne partent vers le backend. Créez un fichier `.env` à la racine du projet avec :

```env
PUBLIC_API_MOCK_ENABLED=true
# Optionnel : simule la latence réseau en millisecondes.
PUBLIC_API_MOCK_DELAY_MS=250
```

Le mock répond avec de vraies réponses HTTP JSON et les mêmes objets que les fonctions de `src/lib/api` attendent. Les routes actuellement couvertes sont `POST /auth/login`, `POST /auth/logout`, `POST /users`, `GET/PATCH /users/:id`, `PATCH /users/:id/preferences`, `GET /cards/:id` et `GET /cards/:id/price-history`.

Utilisez les identifiants `demo-user` et `demo-card` pour afficher les données de démonstration. Une route absente renvoie un `404`, les données invalides un `422` et un utilisateur déjà existant un `409`, ce qui permet aussi de tester les états d'erreur.

## Building


To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

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
- KTD : #1dcf47

### Typos
- Logo : DBacks Regular
- Titles : Palatino Linotype Bold
- Texts : Lato Regular
