import { createBrowserRouter } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { DashboardPage } from '../features/production/pages/DashboardPage'
import { ProductionDaysPage } from '../features/production/pages/ProductionDaysPage'
import { ProductionDayPage } from '../features/production/pages/ProductionDayPage'
import { BalancesPage } from '../features/production/pages/BalancesPage'
import { WeeklySummaryPage } from '../features/production/pages/WeeklySummaryPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'jornadas', element: <ProductionDaysPage /> },
        { path: 'jornadas/:date', element: <ProductionDayPage /> },
        { path: 'saldos', element: <BalancesPage /> },
        { path: 'resumen', element: <WeeklySummaryPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)
