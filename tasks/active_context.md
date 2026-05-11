# Active Context — Albunmanía

> Este archivo se actualiza al inicio y cierre de cada sesión de trabajo.

## Sesión actual

**Fecha:** 2026-05-11
**Foco:** Bloque A — Cleanup pre-desarrollo (8 fases A1 → A8)
**Plan de referencia:** `/home/dev-env/.claude/plans/propuesta-de-plataforma-radiant-cloud.md`

## Estado al iniciar la sesión

- Bootstrap completo del proyecto (commits `4170de8` → `fb51414`).
- Working tree limpio.
- Memory Bank vacío (esta sesión lo crea — fase A1).
- Backend y frontend aún en estado del template (`base_feature_app/_project`, demo Blog/Product/Sale).

## Progreso en curso

### Fase A1 — Memory Bank (en ejecución)
Archivos creados en esta sesión:
- ✅ `docs/methodology/product_requirement_docs.md`
- ✅ `docs/methodology/technical.md`
- ✅ `docs/methodology/architecture.md`
- ✅ `tasks/tasks_plan.md`
- 🟡 `tasks/active_context.md` (este archivo)
- ⏳ `docs/methodology/error-documentation.md`
- ⏳ `docs/methodology/lessons-learned.md`

Pendiente: commit `chore(methodology): initialize Memory Bank for Albunmanía`.

## Decisiones activas (esta sesión)

1. **Scope de la sesión = Bloque A completo** (acordado con el usuario, no incluye Bloque B).
2. **Rename A2 = sed batch atómico** (acordado, no incremental).
3. **`/batch` = paralelismo de tool calls** (acordado).
4. **A3 (purga demo) requiere confirmación humana** antes de ejecutar (regla del plan).
5. **A6 sin `pip install` / `npm install`** automáticos en esta sesión — solo edits a `requirements.txt` y `package.json`. La instalación real la hará el usuario manualmente o en CI.

## Próximos pasos inmediatos

1. Cerrar A1: escribir `error-documentation.md` y `lessons-learned.md`, commit.
2. **A2**: rename atómico (8 referencias en infra + 80 archivos en backend, todo en BATCH).
3. **Pause** antes de A3 — pedir confirmación humana explícita para destructive ops.
4. A4 → A8 secuencial, cada una con su commit aislado.
5. Reporte final con `git log --oneline -n 8`.

## Recordatorios cross-session

- **Nunca correr suite completa de tests.** Siempre archivos específicos.
- **Activar venv** antes de cualquier `pytest` o `manage.py`.
- **Confirmación humana** antes de operaciones destructivas o credenciales.
- **No tocar `docs/release/01-release-checklist.md`** — es la fuente de verdad inmutable de requerimientos.
- **Memory Bank** se actualiza al final de cada épica del Bloque B (no en cleanup).

## Bloqueadores conocidos

Ninguno para Bloque A. Para Bloque B ver `tasks_plan.md` § Known issues.
