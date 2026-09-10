import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { formatCentiKg } from '../../../utils/formatters'

export interface WeeklyProductionChartDatum {
  readonly id: string
  readonly label: string
  readonly dateLabel: string
  readonly dayKg100: number
  readonly nightKg100: number
  readonly treatmentKg100: number
  readonly balanceKg100: number
}

interface WeeklyProductionChartProps {
  data: readonly WeeklyProductionChartDatum[]
}

function calculateFinishedTotalKg100(
  datum: WeeklyProductionChartDatum,
): number {
  return (
    datum.dayKg100 +
    datum.nightKg100 +
    datum.treatmentKg100 +
    datum.balanceKg100
  )
}

function formatAxisKg(valueKg100: number): string {
  const valueKg = valueKg100 / 100
  if (valueKg === 0) return '0'
  if (Math.abs(valueKg) >= 1_000) return `${Math.round(valueKg / 1_000)}k`
  return String(Math.round(valueKg))
}

const axisStepKg100 = 15_000_000

function getAxisScale(data: readonly WeeklyProductionChartDatum[]) {
  const maximumTotalKg100 = Math.max(
    0,
    ...data.map(calculateFinishedTotalKg100),
  )
  const maximumKg100 = Math.max(
    axisStepKg100 * 4,
    Math.ceil(maximumTotalKg100 / axisStepKg100) * axisStepKg100,
  )

  return {
    maximumKg100,
    ticks: Array.from(
      { length: maximumKg100 / axisStepKg100 + 1 },
      (_, index) => index * axisStepKg100,
    ),
  }
}

export function ProductionTooltip({
  active,
  label,
  payload,
}: TooltipContentProps) {
  if (!active || payload.length === 0) return null

  const datum = payload[0]?.payload as WeeklyProductionChartDatum | undefined
  if (!datum) return null

  const finishedTotalKg100 = calculateFinishedTotalKg100(datum)

  const rows = [
    { label: 'Día', value: datum.dayKg100, color: 'var(--color-production-day)' },
    { label: 'Noche', value: datum.nightKg100, color: 'var(--color-production-night)' },
    { label: 'Tratamiento', value: datum.treatmentKg100, color: 'var(--color-production-treatment)' },
    { label: 'Saldo', value: datum.balanceKg100, color: 'var(--color-production-balance)' },
  ] as const

  return (
    <div className="min-w-52 max-w-[calc(100vw-2rem)] rounded-[0.625rem] border border-[var(--color-production-tooltip-border)] bg-[var(--color-production-tooltip)] px-3.5 py-3 text-[#f3f8fb] shadow-[0_8px_24px_rgb(0_0_0/0.22)]">
      <p className="text-xs font-bold uppercase text-[#eef4f8]">
        {label} <span className="number-tabular text-[#7f9bad]">· {datum.dateLabel}</span>
      </p>
      <dl className="mt-3 space-y-2">
        {rows.map((entry) => (
          <div
            key={entry.label}
            className="flex items-center justify-between gap-5 text-[0.6875rem]"
          >
            <dt className="flex items-center gap-2 text-[#7f9bad]">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              {entry.label}
            </dt>
            <dd className="number-tabular whitespace-nowrap font-semibold text-[#f3f8fb]">
              {formatCentiKg(entry.value)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-end justify-between gap-5 border-t border-[var(--color-production-tooltip-border)] pt-2.5">
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#7f9bad]">
          Producto terminado
        </span>
        <span className="number-tabular whitespace-nowrap text-sm font-bold text-[#f3f8fb]">
          {formatCentiKg(finishedTotalKg100)}
        </span>
      </div>
    </div>
  )
}

export function WeeklyProductionChart({ data }: WeeklyProductionChartProps) {
  const axisScale = getAxisScale(data)
  const chartLabel = data
    .map(
      (entry) =>
        `${entry.label}, ${entry.dateLabel}: Día ${formatCentiKg(entry.dayKg100)}, Noche ${formatCentiKg(entry.nightKg100)}, Tratamiento ${formatCentiKg(entry.treatmentKg100)}, Saldo ${formatCentiKg(entry.balanceKg100)} y Producto terminado ${formatCentiKg(calculateFinishedTotalKg100(entry))}`,
    )
    .join('. ')

  return (
    <div
      className="h-[13.5rem] min-w-0 w-full sm:h-[14.5rem]"
      role="img"
      aria-label={`Producción semanal apilada. ${chartLabel}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          barCategoryGap="42%"
          accessibilityLayer
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--color-production-grid)"
            strokeOpacity={0.6}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-slate-500)', fontSize: 11, fontWeight: 600 }}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-slate-500)', fontSize: 10 }}
            tickFormatter={formatAxisKg}
            domain={[0, axisScale.maximumKg100]}
            ticks={axisScale.ticks}
            width={48}
          />
          <Tooltip
            content={ProductionTooltip}
            cursor={{ fill: '#123247', fillOpacity: 0.38 }}
            isAnimationActive={false}
            shared
          />
          <Bar
            dataKey="dayKg100"
            name="Día"
            stackId="production"
            fill="var(--color-production-day)"
            maxBarSize={58}
            isAnimationActive={false}
          />
          <Bar
            dataKey="nightKg100"
            name="Noche"
            stackId="production"
            fill="var(--color-production-night)"
            maxBarSize={58}
            isAnimationActive={false}
          />
          <Bar
            dataKey="treatmentKg100"
            name="Tratamiento"
            stackId="production"
            fill="var(--color-production-treatment)"
            fillOpacity={1}
            stroke="var(--color-production-treatment-stroke)"
            strokeWidth={1}
            maxBarSize={58}
            isAnimationActive={false}
          />
          <Bar
            dataKey="balanceKg100"
            name="Saldo"
            stackId="production"
            fill="var(--color-production-balance)"
            maxBarSize={58}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WeeklyProductionChart
