# Estado de soporte para nuevas jornadas

La aplicación ya trabaja con una colección semanal de jornadas y actualmente
incluye los cierres válidos del miércoles 2 al sábado 5 de septiembre de 2026,
correspondientes a la semana operacional 41. La semana iniciada el lunes 7 de
septiembre de 2026 es la semana operacional 42.
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

## Flujo implementado para el uso individual

Como el registro será realizado por una sola persona, no se agregan usuarios,
permisos ni un backend. La vista de captura permite dos caminos:

1. Ingreso manual: seleccionar únicamente los productos con movimiento y llenar
   los totales físicos de Día, Noche, saldos, tratamiento y producto terminado.
2. Importación: seleccionar el `.xlsx`, elegir una hoja diaria y cargar una vista
   previa editable. Los saldos detectados deben asignarse al producto correcto.
3. En ambos caminos se validan fecha, materia prima, turnos, saldos, tratamiento,
   producto terminado y diferencia con las mismas funciones de dominio.
4. Una jornada válida puede guardarse como borrador; solo puede cerrarse cuando
   la diferencia sea `0.00 kg` y no existan observaciones de integridad.
5. La exportación `.xlsx` solo aparece para jornadas cerradas y cuadradas.

El archivo se procesa localmente en el navegador. La semana 42 comienza vacía y
sus jornadas serán creadas exclusivamente por el usuario desde esta captura.
Los borradores se conservan en el almacenamiento local del navegador; por eso es
recomendable exportar cada cierre como respaldo operativo.

## Datos todavía no incorporados

- `DOMINGO` no se incorpora como jornada de producción porque la hoja
  inspeccionada corresponde al 26/07/2026 y presenta errores `#DIV/0!`. Solo se
  registra el procesamiento de saldo confirmado por el supervisor.
- No se precargan lunes ni martes de la semana 42; esa semana permanece vacía
  hasta que el usuario registre sus propios cierres.
- La interfaz identifica la sesión como `Usuario local / Producción`; no se
  requiere autenticación para el alcance individual confirmado.

## Desglose por turno

Los totales diarios por turno y los totales por producto están conciliados. Cuando
la hoja no etiqueta cada sumando por turno, el detalle individual se conserva con
confianza `RECONCILED_INFERENCE`. Una futura captura operacional debería registrar
ese desglose explícitamente si se necesita como dato auditado.
