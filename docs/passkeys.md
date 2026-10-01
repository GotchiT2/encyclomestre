# Passkeys — contrat FO du 1er octobre 2026

Le contrat courant est `docs/contracts/api.openapi.json`, copie du Swagger fourni pour le Plan 1. La connexion FO utilise exclusivement les passkeys. Les formulaires de mot de passe ont été retirés des parcours de compte.

## Parcours

- `/login` : credential découvrable, grant OAuth passkey puis lecture `/me` et retour à la destination demandée. Annulation, navigateur incompatible et expiration restent distincts.
- `/register` : pseudonyme, création WebAuthn et finalisation OAuth. Les dix codes sont montrés une fois, copiables et téléchargeables ; la session est persistée après confirmation de sauvegarde. Si OAuth réussit et `/me` échoue, reprendre uniquement la lecture du profil conserve les codes sans rejouer la cérémonie.
- `/recovery` : pseudonyme/code inutilisé, ou token reçu dans un lien. Le code ajoute une passkey et consomme un seul code ; le lien remplace les anciennes passkeys, révoque les autres sessions et renouvelle les dix codes, avec confirmation de sauvegarde.
- `/settings` : liste et ajout de passkeys, suppression confirmée, nombre de codes restants et régénération après revérification. La suppression de la dernière passkey est permise par le serveur ; dix clés au maximum.
- Fermeture de compte : aperçu en lecture seule, blocage si propriétaire de guilde, confirmation et revérification. Un résultat réseau incertain est vérifié par lecture `/me` avec le même Bearer, sans nouvelle suppression automatique.

## Requêtes

| Action          | Contrat                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Connexion       | `POST /public/passkeys/options`, sans corps, Bearer ou CAPTCHA                                                             |
| Inscription     | `POST /public/passkeys/signup/options`, `{name,label?}`, Turnstile `signup`                                                |
| Récupération    | `POST /public/passkeys/recovery/options`, `{name,code,label?}` avec Turnstile `recovery`, ou `{token,label?}` sans CAPTCHA |
| Jetons          | `POST /oauth2/token`, formulaire `grant_type=urn:wikiforge:grant-type:passkey`, `request_id`, `credential` JSON            |
| Revérification  | `POST /me/reauth/options`, ou code de secours ; preuve `{requestId,credential}` ou `{recoveryCode}`                        |
| Ajout           | `POST /me/passkeys/options`, puis `POST /me/passkeys` avec `{label?,credential,reauth}`                                    |
| Liste / retrait | `GET /me/passkeys`, `DELETE /me/passkeys/{id}`                                                                             |
| Nouveaux codes  | `POST /me/recovery-codes`, preuve de revérification directement dans le corps                                              |
| Fermeture       | `DELETE /me`, preuve directement dans le corps, Bearer figé et aucun rafraîchissement/rejeu                                |

Les challenges expirent après cinq minutes et sont consommés une fois. Les codes affichés, réponses WebAuthn et preuves restent en mémoire temporaire ; les codes complets ne sont jamais persistés dans la session ou les brouillons. `/me.recoveryCodes` est uniquement un compteur.

## Validation locale

Démarrer le FO HTTPS avec `PUBLIC_API_MOCK_ENABLED=true`, sur le port 5180. `node scripts/check-plan-account.mjs`, ou `node scripts/check-passkeys.mjs fo`, vérifie les parcours avec un authentificateur virtuel résident CTAP2 aux cinq largeurs. Le script `check-passkeys.mjs` utilise ce parcours FO par défaut ; son ancien mode explicite `bo` concerne le projet voisin et reste hors du Plan 1.

Les mocks simulent challenges, délais, codes consommés, revérification, récupération et OAuth. Les données de démonstration et credentials restent en mémoire. Les tests bloquent les appels à l’API de production. Ils vérifient aussi l’absence des codes dans `localStorage` et `sessionStorage`. Ils ne valident pas Cloudflare ni une passkey biométrique réelle en production.
