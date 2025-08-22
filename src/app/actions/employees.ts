import { prisma } from '@/lib/prisma'

export interface EmployeeFormData {
  name: string
  email: string
  employeeId: string
  position: string
  department: string
  salary: number
  hourlyRate?: number
  hireDate: Date
  isActive?: boolean
}

// Get all employees
export async function getEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    })

    return employees.map(employee => ({
      id: employee.id,
      name: employee.user.name,
      email: employee.user.email,
      employeeId: employee.employeeId,
      position: employee.position,
      department: employee.department,
      salary: employee.salary,
      hourlyRate: employee.hourlyRate,
      hireDate: employee.hireDate.toISOString(),
      isActive: employee.isActive
    }))
  } catch (error) {
    console.error('Error fetching employees:', error)
    throw new Error('Failed to fetch employees')
  }
}

// Create Employee
export async function createEmployee(data: EmployeeFormData) {
  try {
    // First create the user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: 'password123', // Default password - should be changed on first login
        role: 'EMPLOYEE'
      }
    })

    // Then create the employee record
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeId: data.employeeId,
        position: data.position,
        department: data.department,
        salary: data.salary,
        hourlyRate: data.hourlyRate,
        hireDate: data.hireDate,
        isActive: data.isActive !== undefined ? data.isActive : true
      },
      include: {
        user: true
      }
    })

    return { success: true, employee }
  } catch (error) {
    console.error('Error creating employee:', error)
    
    if (error.code === 'P2002') {
      const target = error.meta?.target
      if (target?.includes('email')) {
        return { success: false, error: 'Email already exists' }
      }
      if (target?.includes('employeeId')) {
        return { success: false, error: 'Employee ID already exists' }
      }
    }
    
    return { success: false, error: 'Failed to create employee' }
  }
}

// Update Employee
export async function updateEmployee(employeeId: string, data: Partial<EmployeeFormData>) {
  try {
    // Get the current employee to access user ID
    const currentEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true }
    })

    if (!currentEmployee) {
      return { success: false, error: 'Employee not found' }
    }

    // Update user data if name or email changed
    if (data.name || data.email) {
      await prisma.user.update({
        where: { id: currentEmployee.userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email })
        }
      })
    }

    // Update employee data
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...(data.employeeId && { employeeId: data.employeeId }),
        ...(data.position && { position: data.position }),
        ...(data.department && { department: data.department }),
        ...(data.salary !== undefined && { salary: data.salary }),
        ...(data.hourlyRate !== undefined && { hourlyRate: data.hourlyRate }),
        ...(data.hireDate && { hireDate: data.hireDate }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      },
      include: {
        user: true
      }
    })

    return { success: true, employee }
  } catch (error) {
    console.error('Error updating employee:', error)
    
    if (error.code === 'P2002') {
      const target = error.meta?.target
      if (target?.includes('email')) {
        return { success: false, error: 'Email already exists' }
      }
      if (target?.includes('employeeId')) {
        return { success: false, error: 'Employee ID already exists' }
      }
    }
    
    return { success: false, error: 'Failed to update employee' }
  }
}

// Delete Employee (Soft delete by setting isActive to false)
export async function deleteEmployee(employeeId: string, softDelete: boolean = true) {
  try {
    if (softDelete) {
      // Soft delete - just set isActive to false
      const employee = await prisma.employee.update({
        where: { id: employeeId },
        data: { isActive: false },
        include: {
          user: true
        }
      })
      
      return { success: true, message: 'Employee deactivated successfully', employee }
    } else {
      // Hard delete - remove from database (be careful with this)
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { user: true }
      })

      if (!employee) {
        return { success: false, error: 'Employee not found' }
      }

      // Delete in transaction to maintain data integrity
      await prisma.$transaction(async (tx) => {
        // First delete employee record
        await tx.employee.delete({
          where: { id: employeeId }
        })
        
        // Then delete associated user
        await tx.user.delete({
          where: { id: employee.userId }
        })
      })

      return { success: true, message: 'Employee deleted permanently' }
    }
  } catch (error) {
    console.error('Error deleting employee:', error)
    return { success: false, error: 'Failed to delete employee' }
  }
}

// Get Employee by ID
export async function getEmployeeById(employeeId: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: true,
        attendance: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 attendance records
        },
        payrolls: {
          orderBy: { period: 'desc' },
          take: 12 // Last 12 payroll records
        }
      }
    })

    if (!employee) {
      return { success: false, error: 'Employee not found' }
    }

    return { success: true, employee }
  } catch (error) {
    console.error('Error fetching employee:', error)
    return { success: false, error: 'Failed to fetch employee' }
  }
}

// Toggle Employee Status
export async function toggleEmployeeStatus(employeeId: string) {
  try {
    const currentEmployee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!currentEmployee) {
      return { success: false, error: 'Employee not found' }
    }

    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: { isActive: !currentEmployee.isActive },
      include: {
        user: true
      }
    })

    return { 
      success: true, 
      employee, 
      message: `Employee ${employee.isActive ? 'activated' : 'deactivated'} successfully` 
    }
  } catch (error) {
    console.error('Error toggling employee status:', error)
    return { success: false, error: 'Failed to toggle employee status' }
  }
}
