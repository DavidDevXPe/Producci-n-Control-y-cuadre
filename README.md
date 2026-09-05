# TRABUNDA Producción

**Control y Cuadre Operativo**

Aplicación web para consultar el cuadre diario de producción, dar trazabilidad a los saldos por producto y validar la información acumulada de la semana. El archivo Excel es una fuente de reglas de negocio y estructura operativa; la interfaz no intenta copiar su diseño.

La identidad visual utiliza el logo corporativo ubicado en `frontend/public/brand/trabunda-logo-white.png`.

## Alcance del MVP

El MVP es un frontend en React, TypeScript, Vite y Tailwind CSS que incluye:

- dashboard operativo;
- listado y detalle de jornadas;
- cuadre de la jornada del miércoles por turno, producto y familia;
- consulta de saldos y su trazabilidad;
- separación explícita entre cuadre matemático y rendimiento;
- resumen y validación semanal con las fórmulas confirmadas del Excel;
- pruebas unitarias y de componentes para los cálculos principales.

Los datos del MVP están estructurados a partir de `MIÉRCOLES`. `RESUMEN` define la validación semanal. La hoja `JUEVES` no se usa como fuente de datos o reglas.

Backend, base de datos, mantenimiento de catálogos y auditoría persistente corresponden a las siguientes etapas.

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
| `/jornadas/:date` | Detalle de una jornada; el MVP incluye `2026-09-02` |
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
│   │   │   ├── data/             # Datos estructurados del miércoles
│   │   │   ├── model/            # Tipos y cálculos de dominio
│   │   │   └── pages/            # Vistas del módulo
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── test/
│   │   └── utils/
│   └── package.json
└── PARTE_DE_PRODUCCION_02-09-2026.xlsx
```

Las reglas confirmadas y los límites de interpretación están documentados en [docs/reglas-de-negocio.md](docs/reglas-de-negocio.md).
