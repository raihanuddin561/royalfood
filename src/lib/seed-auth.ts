import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

async function createAuthUsers() {
  console.log('Creating demo users for authentication...')

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10)

  try {
    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@royalfood.com' },
      update: {},
      create: {
        email: 'admin@royalfood.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: UserRole.ADMIN,
        isActive: true
      }
    })

    // Create manager user
    const managerUser = await prisma.user.upsert({
      where: { email: 'manager@royalfood.com' },
      update: {},
      create: {
        email: 'manager@royalfood.com',
        password: hashedPassword,
        name: 'Restaurant Manager',
        role: UserRole.MANAGER,
        isActive: true
      }
    })

    // Create employee user
    const employeeUser = await prisma.user.upsert({
      where: { email: 'employee@royalfood.com' },
      update: {},
      create: {
        email: 'employee@royalfood.com',
        password: hashedPassword,
        name: 'Restaurant Employee',
        role: UserRole.EMPLOYEE,
        isActive: true
      }
    })

    // Create employee profiles for manager and employee users
    await prisma.employee.upsert({
      where: { userId: managerUser.id },
      update: {},
      create: {
        userId: managerUser.id,
        employeeId: 'MGR001',
        position: 'Restaurant Manager',
        department: 'Management',
        salary: 50000,
        hireDate: new Date('2024-01-01'),
        isActive: true
      }
    })

    await prisma.employee.upsert({
      where: { userId: employeeUser.id },
      update: {},
      create: {
        userId: employeeUser.id,
        employeeId: 'EMP001',
        position: 'Server',
        department: 'Service',
        salary: 25000,
        hireDate: new Date('2024-02-01'),
        isActive: true
      }
    })

    console.log('✅ Demo users created successfully!')
    console.log('Admin: admin@royalfood.com / password123')
    console.log('Manager: manager@royalfood.com / password123')
    console.log('Employee: employee@royalfood.com / password123')

  } catch (error) {
    console.error('Error creating demo users:', error)
    throw error
  }
}

export { createAuthUsers }
