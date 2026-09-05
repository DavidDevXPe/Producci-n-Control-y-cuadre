# Preparación para nuevas jornadas

Este reporte identifica los acoplamientos actuales al miércoles del MVP. No
incorpora datos de Jueves o Viernes ni modifica los cálculos existentes.

## Regla operativa de saldos

El saldo pendiente de una jornada se procesa normalmente durante el turno Día de
la jornada siguiente. Si el volumen de producción es demasiado alto y el turno
Día no logra terminarlo, el saldo restante puede ser procesado por el turno Noche
de esa misma jornada.

El modelo actual puede representar ambos casos mediante `BalanceUse.shift`. La
asignación nocturna debe proceder siempre de un registro explícito; no debe
inferirse ni aplicarse automáticamente.

| Archivo | Dependencia actual del miércoles | Cambio necesario para varias jornadas |
| --- | --- | --- |
| `DashboardPage.tsx` | Calcula directamente `WEDNESDAY_PRODUCTION_DAY` y construye el resumen semanal con un arreglo que solo contiene esa jornada. | Recibir o consultar una colección de jornadas, seleccionar la última por fecha y calcular el resumen con todas las jornadas del periodo. |
| `ProductionDaysPage.tsx` | Calcula una sola jornada y renderiza una única fila enlazada a la fecha del miércoles. | Ordenar y recorrer la colección de jornadas para generar una fila por fecha sin duplicar la estructura de la tabla. |
| `ProductionDayPage.tsx` | La ruta se considera válida solo cuando coincide con la fecha del miércoles y todos los paneles reciben esa constante. | Buscar la jornada solicitada por fecha en un registro central y calcular los paneles a partir de la jornada encontrada. |
| `BalancesPage.tsx` | Obtiene productos, saldo y jornada de origen exclusivamente desde el cálculo del miércoles. | Consolidar posiciones de saldo de las jornadas disponibles y pasar a `BalancePanel` los consumos posteriores registrados por lote y producto. |
| `WeeklySummaryPage.tsx` | Asocia cálculo únicamente cuando una fecha del calendario coincide con el miércoles. | Construir un índice de cálculos por fecha desde `WEEK_36_2026_PRODUCTION_DAYS` y asociar cada día del calendario con su jornada correspondiente. |

## Impacto futuro en la captura de saldos

- La opción normal de captura debe asignar el saldo recibido al turno Día.
- Noche debe seguir disponible como excepción explícita por volumen operativo.
- Los cálculos deben descontar únicamente la cantidad registrada en cada turno.
- La interfaz de captura futura debería solicitar una observación cuando se use
  saldo durante Noche; el modelo actual registra el turno, pero no el motivo.
- Para validar que el origen es realmente la jornada anterior se necesitará una
  validación entre jornadas. El cálculo aislado actual solo conoce sus
  identificadores de origen y destino.

## Elementos que permanecen fijos en el MVP

- `WEDNESDAY_PRODUCTION_DAY` continúa siendo la única jornada con datos.
- `WEEK_36_2026_PRODUCTION_DAYS` continúa conteniendo solo el miércoles.
- El calendario y el periodo de la semana 36 permanecen definidos en `week36.ts`.
- El detalle de jornada reconoce únicamente la fecha disponible del miércoles.
- `Usuario Demo / Supervisor` continúa como identidad temporal hasta que exista
  autenticación.
- `BalancePanel` conserva su posición visual de cierre cuando todavía no recibe
  consumos de jornadas posteriores.
