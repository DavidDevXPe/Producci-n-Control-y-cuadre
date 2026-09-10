# TRABUNDA Producción

**Control y Cuadre Operativo**

Aplicación web para consultar el cuadre diario de producción, dar trazabilidad a los saldos por producto y validar la información acumulada de la semana. El archivo Excel es una fuente de reglas de negocio y estructura operativa; la interfaz no intenta copiar su diseño.

La identidad visual utiliza el logo corporativo ubicado en `frontend/public/brand/trabunda-logo-white.png`.

## Alcance del MVP

El MVP es un frontend en React, TypeScript, Vite y Tailwind CSS que incluye:

- dashboard operativo;
- listado y detalle de jornadas;
- cuadre de las jornadas registradas de miércoles a sábado por turno, producto y familia;
- consulta de saldos y su trazabilidad;
- separación explícita entre cuadre matemático y rendimiento;
- resumen y validación semanal con las fórmulas confirmadas del Excel;
- pruebas unitarias y de componentes para los cálculos principales.

Los datos actuales corresponden a los cierres válidos de `MIÉRCOLES`, `JUEVES`, `VIERNES` y `SÁBADO`. `RESUMEN` aporta la comprobación semanal independiente. La hoja `DOMINGO` permanece fuera del conjunto porque conserva una fecha histórica, no registra producción de la semana y contiene errores de fórmula.

La aplicación identifica el periodo 31 AGO–06 SEP como semana operacional 41, aunque corresponda a la semana ISO 36. Desde el 7 de septiembre el contexto del encabezado avanza a la semana operacional 42 (07–13 SEP). La semana histórica se presenta como parcial y no completa jornadas ni cantidades inexistentes. Los saldos pendientes se conservan por jornada de origen hasta que exista un uso posterior explícito. El procesamiento confirmado de los 44,660.00 kg de saldo del sábado durante el domingo se registra como movimiento de saldo y no como nueva producción dominical.

Cada jornada cerrada y cuadrada puede descargarse desde su detalle como un archivo `.xlsx` auditable, con resumen, rendimiento y cuadre por producto. La descarga permanece bloqueada si existe una diferencia u observación de integridad.

El alcance actual es de uso local por una sola persona, por lo que no requiere autenticación ni administración de usuarios. Las nuevas jornadas pueden registrarse manualmente o precargarse desde el Excel operativo. En ambos casos se revisan en una vista editable, se guardan en el navegador y solo pueden cerrarse cuando el cuadre sea exacto. El Excel importado no se envía a un servidor.

## Despliegue

La aplicación se publica automáticamente en GitHub Pages al enviar cambios a `main`:

https://daviddevxpe.github.io/Producci-n-Control-y-cuadre/

El flujo `.github/workflows/deploy-pages.yml` instala dependencias, valida TypeScript y ESLint, ejecuta las pruebas, genera el sitio y publica el artefacto. El Excel de referencia permanece únicamente en el entorno local y está excluido del repositorio.

## Ejecución local

Requiere Node.js y npm.

```powershell
cd frontend
npm install
npm run dev
```

Comandos disponibles desde `frontend`:

```powershell
npm run test
npm run check
npm run build
```

- `test`: ejecuta las pruebas con Vitest.
- `check`: valida TypeScript y ESLint.
- `build`: genera la versión de producción.

## Rutas

| Ruta | Contenido |
| --- | --- |
| `/` | Dashboard |
| `/jornadas` | Listado de jornadas |
| `/jornadas/nueva` | Captura manual o importación de una jornada desde Excel |
| `/jornadas/:date/editar` | Continuación de un borrador local |
| `/jornadas/:date` | Detalle de una jornada registrada; actualmente del `2026-09-02` al `2026-09-05` |
| `/saldos` | Saldos por producto y trazabilidad |
| `/resumen` | Resumen y validación semanal |
| Cualquier otra | Página no encontrada |

## Estructura

```text
.
├── docs/
│   └── reglas-de-negocio.md
├── frontend/
│   ├── src/
│   │   ├── app/                  # Router
│   │   ├── components/ui/        # Componentes reutilizables
│   │   ├── features/production/
│   │   │   ├── components/       # Paneles de producción
│   │   │   ├── data/             # Jornadas y periodo semanal estructurados
│   │   │   ├── model/            # Tipos y cálculos de dominio
│   │   │   └── pages/            # Vistas del módulo
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── test/
│   │   └── utils/
│   └── package.json
```

Las reglas confirmadas y los límites de interpretación están documentados en [docs/reglas-de-negocio.md](docs/reglas-de-negocio.md).
