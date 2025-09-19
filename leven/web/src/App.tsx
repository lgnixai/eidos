import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useMemo } from 'react'
import TablesList from './pages/TablesList'
import TableView from './pages/TableView'

function Layout() {
  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-4">
          <Link to="/" className="font-semibold">Leven Tables</Link>
          <nav className="text-sm text-muted-foreground">
            <Link to="/" className="hover:underline">Tables</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<TablesList />} />
          <Route path="/t/:table" element={<TableView />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  const client = useMemo(() => new QueryClient(), [])
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
