# Estado de soporte para nuevas jornadas

La aplicación ya trabaja con una colección semanal de jornadas y actualmente
incluye los cierres válidos del miércoles 2 al sábado 5 de septiembre de 2026.
Dashboard, Jornadas, detalle, Saldos y Resumen consumen esa misma colección.

## Regla operativa de saldos

El saldo pendiente se procesa normalmente durante el turno Día de una jornada
posterior. Si el volumen de producción es excepcionalmente alto, el remanente
puede procesarse durante Noche, pero ese uso debe estar registrado explícitamente.

El consolidado de Saldos reconstruye las posiciones abiertas desde cada cierre y
descuenta únicamente los consumos posteriores registrados para el mismo producto
y jornada de origen. Los 440.00 kg de Recorte Crudo de Aleta originados el jueves
fueron envasados y descontados el viernes, por lo que esa posición queda liquidada.

Los 44,660.00 kg generados como saldo el sábado fueron envasados completamente el
domingo. Este hecho se registra como un consumo de saldo durante el turno Día y
no como nueva producción, por lo que no altera el producto terminado ni el
rendimiento del resumen semanal.

Con ambos movimientos registrados, no quedan saldos pendientes al cierre del
periodo disponible.

## Estado de las vistas

| Archivo | Estado actual para varias jornadas |
| --- | --- |
| `DashboardPage.tsx` | Selecciona el último cierre disponible y resume todas las jornadas registradas. |
| `ProductionDaysPage.tsx` | Recorre la colección semanal y genera una fila por jornada real. |
| `ProductionDayPage.tsx` | Resuelve la jornada solicitada mediante la fecha de la ruta. |
| `BalancesPage.tsx` | Consolida saldos nuevos y heredados pendientes por jornada de origen. |
| `WeeklySummaryPage.tsx` | Calcula el consolidado semanal con todas las jornadas disponibles. |

## Incorporación de una jornada posterior

1. Confirmar que la fecha pertenece al periodo configurado.
2. Transcribir únicamente valores respaldados por la hoja operativa.
3. Registrar cada saldo recibido con su jornada de origen y sus usos reales.
4. Agregar la jornada a `WEEK_36_2026_PRODUCTION_DAYS` en orden cronológico.
5. Conciliar materia prima, turnos, tratamiento, producto terminado, saldo y
   diferencia diaria.
6. Comparar nuevamente el acumulado por jornadas y por productos con `RESUMEN`.
7. Ejecutar comprobaciones estáticas, pruebas y compilación.

## Datos todavía no incorporados

- `DOMINGO` no se incorpora como jornada de producción porque la hoja
  inspeccionada corresponde al 26/07/2026 y presenta errores `#DIV/0!`. Solo se
  registra el procesamiento de saldo confirmado por el supervisor.
- No se inventan lunes o martes; el periodo continúa identificado como semana
  parcial de cuatro jornadas registradas.
- `Usuario Demo / Supervisor` continúa como identidad temporal hasta que exista
  autenticación.

## Desglose por turno

Los totales diarios por turno y los totales por producto están conciliados. Cuando
la hoja no etiqueta cada sumando por turno, el detalle individual se conserva con
confianza `RECONCILED_INFERENCE`. Una futura captura operacional debería registrar
ese desglose explícitamente si se necesita como dato auditado.
