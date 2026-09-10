import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { ProductionDataProvider } from './features/production/state/ProductionDataContext'

export function App() {
  return (
    <ProductionDataProvider>
      <RouterProvider router={router} />
    </ProductionDataProvider>
  )
}

export default App

