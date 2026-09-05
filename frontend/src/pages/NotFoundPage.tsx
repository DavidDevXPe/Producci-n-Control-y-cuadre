import { ArrowLeft, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'

export function NotFoundPage() {
  usePageTitle('Página no encontrada')

  return (
    <section className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-brand-100 text-brand-800">
        <SearchX className="size-8" aria-hidden="true" />
      </span>
      <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">
        Error 404
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        Esta página no existe
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        La dirección puede estar incompleta o la vista todavía no forma parte del
        control de producción.
      </p>
      <Link
        to="/"
        className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al dashboard
      </Link>
    </section>
  )
}

