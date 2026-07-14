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

## API WikiForge

Le frontend utilise l’API WikiForge et ses contrats OpenAPI. Créez un fichier `.env` à la racine du projet avec :

```env
PUBLIC_API_BASE_URL=http://localhost:8080
PUBLIC_API_MOCK_ENABLED=false
```

Le Swagger local est disponible sur `http://localhost:8080/swagger-ui/index.html`. Le mock historique reste réservé aux tests unitaires du client et ne couvre pas les parcours applicatifs complets.

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
