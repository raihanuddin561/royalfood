import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
