import { DefaultSession, DefaultUser } from 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      isActive: boolean
      employee?: {
        id: string
        employeeId: string
        position: string
        department: string
      } | null
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: UserRole
    isActive: boolean
    employee?: {
      id: string
      employeeId: string
      position: string
      department: string
    } | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    isActive: boolean
    employee?: {
      id: string
      employeeId: string
      position: string
      department: string
    } | null
  }
}
