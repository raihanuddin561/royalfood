import { Metadata } from 'next'
import MigrationManager from '@/components/admin/MigrationManager'

export const metadata: Metadata = {
  title: 'Database Migrations - Admin Panel',
  description: 'Manage database migrations and schema updates',
}

export default function MigrationsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Database Migrations</h1>
        <p className="text-gray-600 mt-2">
          Manage Prisma database migrations and schema updates for production deployment
        </p>
      </div>
      
      <MigrationManager />
    </div>
  )
}