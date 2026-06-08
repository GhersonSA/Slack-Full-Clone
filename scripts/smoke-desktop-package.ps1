param(
  [string]$DesktopPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'desktop')
)

$ErrorActionPreference = 'Stop'

$distPath = Join-Path $DesktopPath 'dist'
$winUnpackedPath = Join-Path $distPath 'win-unpacked'
$exePath = Join-Path $winUnpackedPath 'desktop.exe'
$asarPath = Join-Path $winUnpackedPath 'resources/app.asar'

if (!(Test-Path $distPath)) {
  throw "[smoke] No existe directorio dist: $distPath"
}

if (!(Test-Path $winUnpackedPath)) {
  throw "[smoke] No existe artefacto win-unpacked: $winUnpackedPath"
}

if (!(Test-Path $exePath)) {
  throw "[smoke] Ejecutable no encontrado: $exePath"
}

if (!(Test-Path $asarPath)) {
  throw "[smoke] app.asar no encontrado: $asarPath"
}

$exeInfo = Get-Item $exePath
$asarInfo = Get-Item $asarPath

if ($exeInfo.Length -le 0) {
  throw '[smoke] El ejecutable generado esta vacio.'
}

if ($asarInfo.Length -le 0) {
  throw '[smoke] El paquete app.asar generado esta vacio.'
}

Write-Host '[smoke] OK - artefacto desktop generado correctamente.'
Write-Host "[smoke] exe: $($exeInfo.FullName)"
Write-Host "[smoke] exe size: $([Math]::Round($exeInfo.Length / 1MB, 2)) MB"
Write-Host "[smoke] asar: $($asarInfo.FullName)"
Write-Host "[smoke] asar size: $([Math]::Round($asarInfo.Length / 1MB, 2)) MB"
