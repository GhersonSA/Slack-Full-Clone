$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot 'backend'
$desktopPath = Join-Path $repoRoot 'desktop'
$venvPython = Join-Path $backendPath '.venv/Scripts/python.exe'

Write-Host '[bootstrap] Preparando backend...'

if (!(Test-Path $venvPython)) {
  Write-Host '[bootstrap] Creando entorno virtual en backend/.venv'
  Set-Location $backendPath
  python -m venv .venv
}

Set-Location $backendPath
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r requirements.txt

if (!(Test-Path (Join-Path $backendPath '.env'))) {
  Copy-Item (Join-Path $backendPath '.env.example') (Join-Path $backendPath '.env')
  Write-Host '[bootstrap] Archivo backend/.env creado desde .env.example'
}

& $venvPython -m alembic upgrade head

Write-Host '[bootstrap] Preparando desktop...'
Set-Location $desktopPath
npm ci

Write-Host '[bootstrap] Entorno listo.'
Write-Host '[bootstrap] Siguiente paso backend: Set-Location ./backend; ./.venv/Scripts/Activate.ps1; uvicorn app.main:app --reload'
Write-Host '[bootstrap] Siguiente paso desktop: Set-Location ./desktop; npm run dev'
