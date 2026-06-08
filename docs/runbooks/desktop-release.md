# Desktop Release Runbook

Runbook operativo para generar y validar artefactos desktop del MVP.

## Objetivo

Generar un build desktop reproducible y ejecutar smoke checks minimos del paquete resultante.

## Prerrequisitos

- Repo clonado localmente.
- Dependencias instaladas via `./scripts/bootstrap.ps1`.
- Backend y desktop tests en verde.

## Comando principal

```powershell
./scripts/release-desktop.ps1
```

Este comando ejecuta:

1. `./scripts/validate.ps1`
2. `npm run build:unpack` en `desktop/`
3. `./scripts/smoke-desktop-package.ps1`

Nota: para release local se desactiva firma/edicion del ejecutable de forma automatica
(`ELECTRON_BUILDER_DISABLE_SIGN_AND_EDIT_EXECUTABLE=true`) para evitar errores de privilegios.

## Modo rapido (sin quality gates)

Solo para iteraciones locales rapidas:

```powershell
./scripts/release-desktop.ps1 -SkipValidate
```

## Smoke checklist post-build

El smoke script valida automaticamente:

- Existe `desktop/dist/win-unpacked/`
- Existe `desktop/dist/win-unpacked/desktop.exe`
- Existe `desktop/dist/win-unpacked/resources/app.asar`
- Ambos archivos tienen tamano mayor a cero

## Artefactos esperados

- Ejecutable unpacked para validaciones funcionales locales
- Archivos de `desktop/dist/` para inspeccion y pruebas manuales

## Troubleshooting

1. Fallo en tests/typecheck:
   - Ejecutar `./scripts/validate.ps1` y corregir errores antes de build.
2. Fallo en build unpacked:
   - Verificar `desktop/package-lock.json` y reinstalar con `npm ci`.
   - Verificar que no existan politicas del sistema bloqueando escritura en `desktop/dist/`.
   - Si aparecen warnings de `winCodeSign` por symlinks en Windows sin privilegios,
     confirmar que el proceso completa y luego validar con el smoke script.
3. Fallo en smoke del ejecutable:
   - Limpiar `desktop/dist/` y reintentar el release.
