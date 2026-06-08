$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot 'backend'
$desktopPath = Join-Path $repoRoot 'desktop'
$venvPython = Join-Path $backendPath '.venv/Scripts/python.exe'

if (!(Test-Path $venvPython)) {
  throw '[validate] No existe backend/.venv. Ejecuta ./scripts/bootstrap.ps1 primero.'
}

Write-Host '[validate] Ejecutando backend tests...'
Set-Location $backendPath
& $venvPython -m pytest tests/test_realtime_flow.py -q

Write-Host '[validate] Ejecutando desktop tests...'
Set-Location $desktopPath
npm run test:web

Write-Host '[validate] Ejecutando desktop typecheck...'
npm run typecheck

Write-Host '[validate] OK - todos los quality gates pasaron.'
