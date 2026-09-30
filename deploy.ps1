# Arrête le script en cas d'erreur PowerShell
$ErrorActionPreference = "Stop"

# Sous Windows PowerShell 5.1, un code de sortie non nul d'une commande native (npm, ssh, scp) n'arrête pas le script :
# chaque appel est donc vérifié explicitement.
function Invoke-Step([string] $Label, [scriptblock] $Command) {
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Label a échoué (code $LASTEXITCODE). Déploiement interrompu."
    }
}

# Chargement des variables du fichier .env
if (-Not (Test-Path .env)) {
    throw "Fichier .env introuvable à la racine du projet."
}

Get-Content .env | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' } | ForEach-Object {
    $name, $value = $_ -split '=', 2
    Set-Variable -Name $name.Trim() -Value $value.Trim() -Scope Script
}

# Une variable vide transformerait la commande distante : DEPLOY_PATH vide donnerait « rm -rf /* ».
foreach ($required in 'DEPLOY_HOST', 'DEPLOY_USER', 'DEPLOY_PATH', 'SSH_KEY_PATH') {
    if (-not (Get-Variable -Name $required -ValueOnly -ErrorAction SilentlyContinue)) {
        throw "$required est absent ou vide dans .env."
    }
}
$DEPLOY_PATH = $DEPLOY_PATH.TrimEnd('/')
if ($DEPLOY_PATH -in '', '~', '.', '..' -or $DEPLOY_PATH.Contains('*')) {
    throw "DEPLOY_PATH désigne la racine, le dossier personnel ou un motif ('$DEPLOY_PATH') : refusé."
}

# Port par défaut à 22 si DEPLOY_PORT n'est pas défini dans .env
if (-not $DEPLOY_PORT) { $DEPLOY_PORT = "22" }

Write-Host "1/3 Execution du build..." -ForegroundColor Cyan
Invoke-Step "Le build" { npm run build }
if (-not (Test-Path build/index.html)) {
    throw "build/index.html est absent après le build. Déploiement interrompu."
}

Write-Host "2/3 Nettoyage du dossier distant ($DEPLOY_PATH) sur le port $DEPLOY_PORT..." -ForegroundColor Cyan
Invoke-Step "Le nettoyage distant" { ssh -i "$SSH_KEY_PATH" -p $DEPLOY_PORT "$DEPLOY_USER@$DEPLOY_HOST" "rm -rf ${DEPLOY_PATH}/*" }

Write-Host "3/3 Envoi du contenu de ./build..." -ForegroundColor Cyan
Invoke-Step "L'envoi (le site distant est vide ou incomplet)" { scp -i "$SSH_KEY_PATH" -P $DEPLOY_PORT -r build/* "$DEPLOY_USER@${DEPLOY_HOST}:${DEPLOY_PATH}/" }

Write-Host "Déploiement terminé avec succès !" -ForegroundColor Green
