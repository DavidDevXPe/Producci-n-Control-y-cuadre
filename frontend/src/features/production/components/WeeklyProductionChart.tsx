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
}

interface WeeklyProductionChartProps {
  data: readonly WeeklyProductionChartDatum[]
}

function calculateTooltipTotalKg100(
  datum: WeeklyProductionChartDatum,
): number {
  return datum.dayKg100 + datum.nightKg100 + datum.treatmentKg100
}

function formatAxisKg(valueKg100: number): string {
  const valueKg = valueKg100 / 100
  if (valueKg === 0) return '0'
  if (Math.abs(valueKg) >= 1_000) return `${Math.round(valueKg / 1_000)}k`
  return String(Math.round(valueKg))
}

export function ProductionTooltip({
  active,
  label,
  payload,
}: TooltipContentProps) {
  if (!active || payload.length === 0) return null

  const datum = payload[0]?.payload as WeeklyProductionChartDatum | undefined
  if (!datum) return null

  const totalProcessedKg100 = calculateTooltipTotalKg100(datum)

  const rows = [
    { label: 'Día', value: datum.dayKg100, color: '#169fd0' },
    { label: 'Noche', value: datum.nightKg100, color: '#0d7098' },
    { label: 'Tratamiento', value: datum.treatmentKg100, color: '#9fb3c2' },
  ] as const

  return (
    <div className="min-w-52 rounded-[0.625rem] border border-[#244052] bg-[#0e1d29] px-3.5 py-3 text-[#eef4f8] shadow-[0_8px_24px_rgb(0_0_0/0.18)]">
      <p className="text-xs font-bold text-[#eef4f8]">
        {label}, <span className="number-tabular text-[#94a9b8]">{datum.dateLabel}</span>
      </p>
      <dl className="mt-3 space-y-2">
        {rows.map((entry) => (
          <div
            key={entry.label}
            className="flex items-center justify-between gap-5 text-[0.6875rem]"
          >
            <dt className="flex items-center gap-2 text-[#94a9b8]">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              {entry.label}
            </dt>
            <dd className="number-tabular whitespace-nowrap font-semibold text-[#eef4f8]">
              {formatCentiKg(entry.value)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-end justify-between gap-5 border-t border-[#244052] pt-2.5">
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#94a9b8]">
          Total procesado
        </span>
        <span className="number-tabular whitespace-nowrap text-xs font-bold text-[#eef4f8]">
          {formatCentiKg(totalProcessedKg100)}
        </span>
      </div>
    </div>
  )
}

export function WeeklyProductionChart({ data }: WeeklyProductionChartProps) {
  const chartLabel = data
    .map(
      (entry) =>
        `${entry.label}, ${entry.dateLabel}: Día ${formatCentiKg(entry.dayKg100)}, Noche ${formatCentiKg(entry.nightKg100)}, Tratamiento ${formatCentiKg(entry.treatmentKg100)} y total procesado ${formatCentiKg(calculateTooltipTotalKg100(entry))}`,
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
            stroke="var(--color-slate-200)"
            strokeOpacity={0.55}
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
            width={48}
          />
          <Tooltip
            content={ProductionTooltip}
            cursor={{ fill: 'var(--color-slate-100)', fillOpacity: 0.45 }}
            isAnimationActive={false}
            shared
          />
          <Bar
            dataKey="dayKg100"
            name="Día"
            stackId="production"
            fill="#169fd0"
            maxBarSize={52}
            isAnimationActive={false}
          />
          <Bar
            dataKey="nightKg100"
            name="Noche"
            stackId="production"
            fill="#0d7098"
            maxBarSize={52}
            isAnimationActive={false}
          />
          <Bar
            dataKey="treatmentKg100"
            name="Tratamiento"
            stackId="production"
            fill="#9fb3c2"
            maxBarSize={52}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WeeklyProductionChart
