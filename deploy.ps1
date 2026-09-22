# Arrête le script en cas d'erreur
$ErrorActionPreference = "Stop"

# Chargement des variables du fichier .env
if (-Not (Test-Path .env)) {
    Write-Error "Fichier .env introuvable à la racine du projet."
}

Get-Content .env | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' } | ForEach-Object {
    $name, $value = $_ -split '=', 2
    Set-Variable -Name $name.Trim() -Value $value.Trim() -Scope Script
}

# Port par défaut à 22 si DEPLOY_PORT n'est pas défini dans .env
if (-not $DEPLOY_PORT) { $DEPLOY_PORT = "22" }

Write-Host "1/3 Execution du build..." -ForegroundColor Cyan
npm run build

Write-Host "2/3 Nettoyage du dossier distant ($DEPLOY_PATH) sur le port $DEPLOY_PORT..." -ForegroundColor Cyan
ssh -i "$SSH_KEY_PATH" -p $DEPLOY_PORT "$DEPLOY_USER@$DEPLOY_HOST" "rm -rf ${DEPLOY_PATH}/*"

Write-Host "3/3 Envoi du contenu de ./build..." -ForegroundColor Cyan
scp -i "$SSH_KEY_PATH" -P $DEPLOY_PORT -r build/* "$DEPLOY_USER@${DEPLOY_HOST}:${DEPLOY_PATH}/"

Write-Host "Déploiement terminé avec succès !" -ForegroundColor Green
