import { useEffect, useRef, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  History,
  LayoutDashboard,
  Menu,
  PackageOpen,
  Settings,
  X,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const brandLogoUrl = `${import.meta.env.BASE_URL}brand/trabunda-logo-white.png`

type NavigationItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

type UpcomingNavigationItem = {
  label: string
  icon: LucideIcon
}

const primaryNavigation: readonly NavigationItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Jornadas', to: '/jornadas', icon: CalendarDays },
  { label: 'Saldos', to: '/saldos', icon: PackageOpen },
  { label: 'Resumen', to: '/resumen', icon: BarChart3 },
]

const upcomingNavigation: readonly UpcomingNavigationItem[] = [
  { label: 'Catálogos', icon: Settings },
  { label: 'Auditoría', icon: History },
]

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
    isActive
      ? 'bg-sky-500 text-white shadow-sm shadow-sky-950/20'
      : 'text-slate-300 hover:bg-white/8 hover:text-white',
  ].join(' ')

interface SidebarContentProps {
  onNavigate?: () => void
}

function SidebarContent({ onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="h-28 border-b border-white/10 px-4 py-3">
        <div className="flex h-16 items-center justify-center overflow-hidden rounded-xl bg-white px-2 shadow-lg shadow-black/20">
          <img
            src={brandLogoUrl}
            alt="Trabunda Procesos Marinos"
            className="h-auto w-full max-w-none"
          />
        </div>
        <p className="mt-2 text-center text-[0.625rem] font-extrabold uppercase tracking-[0.12em] text-slate-400">
          Producción · Control y cuadre
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <nav aria-label="Navegación principal">
          <p className="mb-2 px-3 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-slate-500">
            Operación
          </p>
          <ul className="space-y-1">
            {primaryNavigation.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end ?? false}
                    className={navLinkClassName}
                    onClick={() => onNavigate?.()}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <nav className="mt-8" aria-label="Módulos próximos">
          <p className="mb-2 px-3 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-slate-500">
            Administración
          </p>
          <ul className="space-y-1">
            {upcomingNavigation.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    disabled
                    className="flex min-h-11 w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-500"
                    title="Disponible próximamente"
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-slate-500">
                      Próximamente
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-xs font-bold text-slate-300">TRABUNDA Producción</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Control y Cuadre Operativo
        </p>
      </div>
    </div>
  )
}

function getSectionLabel(pathname: string) {
  const activeItem = primaryNavigation.find((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to),
  )

  return activeItem?.label ?? 'Control de producción'
}

export function AdminLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const sectionLabel = getSectionLabel(location.pathname)

  useEffect(() => {
    if (!isMenuOpen) return

    const previouslyFocusedElement = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
      previouslyFocusedElement?.focus()
    }
  }, [isMenuOpen])

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950">
      <a
        href="#contenido-principal"
        className="fixed left-4 top-3 z-[70] -translate-y-24 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-lg focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        Saltar al contenido principal
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Abrir menú de navegación"
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="flex h-10 w-28 shrink-0 items-center justify-center overflow-hidden bg-white">
            <img
              src={brandLogoUrl}
              alt="Trabunda Procesos Marinos"
              className="h-auto w-28 max-w-none"
            />
          </div>
        </div>
        <p className="min-w-0 truncate text-sm font-bold text-slate-900">{sectionLabel}</p>
      </header>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-label="Cerrar menú de navegación"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside
            id="mobile-navigation"
            className="relative h-full w-[min(20rem,88vw)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <button
              ref={closeButtonRef}
              type="button"
              className="absolute right-3 top-5 z-10 grid size-10 place-items-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              aria-label="Cerrar menú"
              onClick={() => setIsMenuOpen(false)}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <SidebarContent onNavigate={() => setIsMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 lg:pl-72">
        <div className="hidden h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:flex xl:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
              TRABUNDA Producción
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">{sectionLabel}</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Operación semanal
          </span>
        </div>

        <main
          id="contenido-principal"
          tabIndex={-1}
          className="mx-auto min-w-0 w-full max-w-[100rem] px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
