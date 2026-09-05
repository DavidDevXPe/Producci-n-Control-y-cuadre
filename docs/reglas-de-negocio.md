# Reglas de negocio confirmadas

## Fuentes autorizadas

- `MIÉRCOLES` es la fuente principal para la estructura del cuadre, productos, familias, turnos, tratamiento, producto terminado y saldo final.
- `RESUMEN` aporta las fórmulas y la validación acumulada de la semana.
- `JUEVES` solo ilustra que un reporte físico puede incluir saldo procesado de una jornada anterior. No se usa para deducir datos, fórmulas ni reglas.
- Las demás hojas quedan fuera del alcance inicial.

El Excel se interpreta como fuente operativa, no como plantilla visual.

## Producción por turno y saldos anteriores

Un saldo conserva su jornada de origen aunque se termine de procesar en una jornada posterior. Debe trazarse por familia, producto, cantidad, jornada de origen y turno que lo procesa.

Para cada producto y turno:

```text
Producción propia del turno =
  producción reportada por el turno
  + ajustes explícitos aplicables
  − saldo anterior realmente procesado en ese turno
```

No se descuenta automáticamente todo el saldo anterior: puede repartirse entre Día y Noche o quedar parcialmente pendiente. La parte no procesada conserva su origen y continúa pendiente.

La interfaz debe mostrar cada operando. No se permiten descuentos, constantes ni ajustes ocultos dentro de fórmulas.

## Cuadre diario

La igualdad operativa es:

```text
Producto terminado esperado =
  producción propia del turno Día
  + producción propia del turno Noche
  + tratamiento
  + nuevo saldo final de la jornada
```

De forma equivalente:

```text
Saldo final calculado =
  producto terminado declarado
  − producción propia de ambos turnos
  − tratamiento
```

La diferencia compara el producto terminado esperado con el declarado. Una jornada está `CUADRADA` cuando la diferencia es cero y el detalle por productos y turnos también es consistente; de lo contrario está `NO CUADRADA`.

El saldo recibido de una jornada anterior y el nuevo saldo generado por la jornada actual son conceptos distintos y no deben mezclarse.

## Rendimiento

```text
Rendimiento de la jornada =
  producto terminado ÷ materia prima × 100
```

El 80% es una referencia operativa, no una validación rígida ni una cantidad que deba forzarse. Un rendimiento inferior puede deberse a saldos pendientes, tratamiento, procesos inconclusos, mermas u otros factores productivos.

Por ello, cuadre y rendimiento se presentan por separado:

- puede existir una jornada cuadrada con rendimiento menor al 80%;
- puede existir rendimiento igual o mayor al 80% con un descuadre matemático.

El rendimiento semanal usa los acumulados, no el promedio simple de porcentajes diarios:

```text
Rendimiento semanal =
  producto terminado total de la semana
  ÷ materia prima total de la semana
  × 100
```

## Nuca Bikini

La Nuca Bikini es el producto obtenido al lavar y limpiar la Nuca. Este proceso se realiza únicamente cuando existe un pedido.

Cuando aplica:

```text
Referencia de Nuca Bikini = materia prima total aplicable × 7%
```

El 7% es una referencia del proceso, no un ajuste de cuadre. Si no existe un pedido confirmado, el indicador debe mostrarse como `NO APLICA`; la ausencia de Nuca Bikini no constituye un error.

## Resumen semanal

`RESUMEN` consolida por identificadores estables de jornada, familia y producto, sin depender de posiciones de filas.

```text
Materia prima semanal = suma de materia prima de las jornadas

Producto semanal por producto = suma del producto en las jornadas

Producto terminado semanal por jornadas =
  suma del total declarado de cada jornada

Producto terminado semanal por detalle =
  suma del consolidado de productos

Diferencia semanal =
  producto terminado por jornadas
  − producto terminado por detalle
```

La información semanal es consistente cuando ambos caminos coinciden, las jornadas incluidas están cuadradas y no existen problemas de integridad.

La distribución referencial de materia prima del resumen es:

- Tubo: 50%.
- Aleta: 20%.
- Rejos: 15%.
- Nucas: 15%.

```text
Rendimiento del grupo = subtotal del grupo ÷ materia prima asignada

Aprovechamiento del grupo = subtotal del grupo ÷ materia prima semanal
```

Una semana parcial debe identificarse como tal; no se completan jornadas ni cantidades inexistentes.

## Fuera del MVP

El backend, la base de datos, la edición persistente, los catálogos administrables y la auditoría completa se implementarán en etapas posteriores.
