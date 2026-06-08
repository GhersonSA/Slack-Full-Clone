param(
  [switch]$SkipValidate = $false
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$desktopPath = Join-Path $repoRoot 'desktop'
$validateScript = Join-Path $PSScriptRoot 'validate.ps1'
$smokeScript = Join-Path $PSScriptRoot 'smoke-desktop-package.ps1'

if (!(Test-Path $desktopPath)) {
  throw "[release-desktop] Desktop path no encontrado: $desktopPath"
}

if (-not $SkipValidate) {
  Write-Host '[release-desktop] Ejecutando quality gates previos...'
  & $validateScript
} else {
  Write-Host '[release-desktop] SkipValidate activo: se omiten quality gates previos.'
}

Write-Host '[release-desktop] Construyendo artefacto desktop (unpacked)...'
Set-Location $desktopPath
$previousDisableSign = $env:ELECTRON_BUILDER_DISABLE_SIGN_AND_EDIT_EXECUTABLE
$env:ELECTRON_BUILDER_DISABLE_SIGN_AND_EDIT_EXECUTABLE = 'true'
try {
  npm run build:unpack
} finally {
  if ($null -ne $previousDisableSign) {
    $env:ELECTRON_BUILDER_DISABLE_SIGN_AND_EDIT_EXECUTABLE = $previousDisableSign
  } else {
    Remove-Item Env:ELECTRON_BUILDER_DISABLE_SIGN_AND_EDIT_EXECUTABLE -ErrorAction SilentlyContinue
  }
}

Write-Host '[release-desktop] Ejecutando smoke check de artefacto...'
& $smokeScript -DesktopPath $desktopPath

Write-Host '[release-desktop] Release local desktop completado.'
Write-Host "[release-desktop] Artefacto disponible en: $(Join-Path $desktopPath 'dist/win-unpacked')"
