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

## Reprendre les enchères du FO

Le parcours est orchestré par `src/routes/market`, avec les composants dans `src/lib/components/market` et le cycle réseau dans `src/lib/auctions/detail-controller.ts`. Les limites du contrat et les besoins backend sont décrits dans [le rapport API](docs/api-auctions-reporting-needs.md). L’avancement est consigné dans `.agents/PLAN.md`.

Pour reproduire les parcours sans écriture réelle, lancer dans un terminal PowerShell dédié :

```powershell
$env:PUBLIC_API_MOCK_ENABLED = 'true'
$env:PUBLIC_API_MOCK_DELAY_MS = '10'
npm run dev -- --host 127.0.0.1 --port 5180
```

Puis, dans un autre terminal :

```powershell
node scripts/check-auctions.mjs https://127.0.0.1:5180
```

Ce script initialise une session fictive, bloque les appels vers l’API de production et vérifie les parcours à cinq largeurs. Les captures sont enregistrées dans le dossier temporaire `wikiforge-auctions`. Les tests unitaires et composants se lancent avec `npm test` ; compléter par `npm run check` et `npm run build` après l’arrêt du serveur de test.

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

# Reprise de la couverture Swagger du FO

Le guide de reprise de cette évolution est dans [docs/fo-handoff.md](docs/fo-handoff.md). La [matrice des 117 opérations](docs/api-fo-coverage.md) relie le contrat aux écrans et modules ; les [recommandations UX/UI](docs/ux-ui-recommendations.md) séparent les améliorations front des évolutions API nécessaires.
