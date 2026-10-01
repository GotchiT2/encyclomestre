# Passkeys — reprise de l’intégration

La branche `passkey` part du `main` courant. Aucun commit, push ou déploiement effectué dans cette étape.

## Parcours livrés

- Connexion explicite sans identifiant : options publiques, cérémonie WebAuthn avec `@simplewebauthn/browser`, grant OAuth puis `/me`. Finalisation de session commune au mot de passe, cookies inclus. Le BO conserve uniquement les sessions ADMIN ; un refus ou une lecture du profil échouée efface la session.
- FO : section Passkeys dans `/settings`. BO : `/security`, accessible dans le menu.
- Liste normalisée à vide si le serveur omet la réponse ; nom, synchronisation, dates UTC et suppression confirmée. Limite de dix passkeys.
- Ajout : nom de 64 caractères maximum, mot de passe actuel, options serveur et réponse JSON complète. Turnstile `action=passkey`, jeton renouvelé avant chaque tentative. La connexion passkey ne demande aucun CAPTCHA.
- Un mot de passe ou CAPTCHA refusé conserve la réponse WebAuthn en mémoire jusqu’à l’expiration de cinq minutes. Un challenge rejeté impose de nouvelles options ; un conflit recharge la liste. Une écriture au résultat incertain provoque une relecture, jamais une répétition automatique.
- Suppression : avertissement sur la passkey restant dans l’appareil et les sessions existantes ; action de déconnexion globale disponible. Fermeture du dialogue ou navigation annule la cérémonie et efface les données sensibles en mémoire.

## Contrat API 1.2.0

Source : `message.md` fourni par le propriétaire du projet.

| Opération | Requête |
|---|---|
| Connexion : options | `POST /public/passkeys/options`, aucun corps ni Bearer |
| Connexion : jetons | `POST /oauth2/token`, formulaire `grant_type=urn:wikiforge:grant-type:passkey`, `request_id`, `credential` JSON |
| Liste | `GET /me/passkeys` |
| Ajout : options | `POST /me/passkeys/options`, aucun corps |
| Ajout : enregistrement | `POST /me/passkeys`, JSON `{password,label,credential}`, en-tête `CF-Turnstile-Response` |
| Suppression | `DELETE /me/passkeys/{id}`, identifiant encodé |
| Sessions | `POST /auth/logout-all` |

Les options publiques et le grant ne reprennent pas un ancien Bearer. Les opérations consommant un challenge et les écritures ne sont pas rejouées sur 401. Les options RP ID et origines viennent du serveur et ne sont jamais réécrites en mode réel. La limite du pseudo déjà intégrée reste inchangée.

## Développement et mocks

Installer avec `npm install`, puis `npm run dev` selon la configuration HTTPS locale existante. Pour une démonstration, utiliser explicitement `PUBLIC_API_MOCK_ENABLED=true`. Aucune bascule automatique depuis l’API réelle.

Les mocks utilisent le mot de passe `demo-password`, un authentificateur du navigateur et un RP local. Les enregistrements de démonstration restent uniquement en mémoire. Dans la console, définir `sessionStorage.setItem('wikiforge-passkey-scenario', 'limit')`, puis recharger le parcours. Autres scénarios : `empty`, `captcha`, `expired`, `invalid-grant` ; `denied` sur le BO simule un rôle USER. Retirer cette clé pour revenir au succès. Aucun mot de passe, challenge ou réponse WebAuthn n’est enregistré dans le stockage local.

## Validation

Check, ESLint ciblé, Vitest et build sont exécutés dans chaque dépôt, ainsi que `git diff --check`. Les tests de contrats couvrent les formulaires OAuth, les erreurs HTTP, les corps d’enregistrement, les listes omises, le contrôle ADMIN et les défis à usage unique/expirés.

Le script Playwright `scripts/check-passkeys.mjs` du FO vérifie les deux applications avec un authentificateur virtuel résident CTAP2. Lancer deux serveurs Vite HTTPS **en mode mock** sur 5180 (FO) et 5181 (BO), puis `node scripts/check-passkeys.mjs`. Un argument `fo` ou `bo` limite le parcours. Toutes les requêtes vers l’API de production sont bloquées. Les captures sont écrites dans le dossier temporaire `wikiforge-passkeys`.

Parcours aux largeurs 360, 390, 768, 1024 et 1440 : ajout, erreur de mot de passe puis correction sans recréer la credential, connexion sans identifiant, nouveau challenge après `invalid_grant`, suppression, contrôle de débordement et absence d’erreurs JavaScript. Le test de composant FO vérifie séparément l’action Turnstile et le renouvellement du jeton ; les parcours mock ne valident pas Cloudflare réel.

Une cérémonie virtuelle ne valide pas une connexion biométrique en production. La validation réelle devra employer un navigateur compatible, HTTPS, les origines autorisées côté serveur et un compte habilité. Aucun appel d’écriture en production n’a été effectué.
