import prisma from './prisma'

/**
 * Generate a unique employeeId with the given prefix and random alphanumeric suffix.
 * It checks the database to ensure the id doesn't already exist.
 */
export async function generateUniqueEmployeeId(prefix = 'EMP', length = 6) {
  const maxAttempts = 10000
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // generate a random alphanumeric suffix (uppercase)
    const suffix = Math.random().toString(36).substring(2, 2 + length).toUpperCase()
    const candidate = `${prefix}${suffix}`

    // check uniqueness in DB
    // use findFirst to avoid typing issues with composite keys
    const existing = await prisma.employee.findFirst({ where: { employeeId: candidate } as any })
    if (!existing) return candidate
  }

  throw new Error('Unable to generate a unique employee id after many attempts')
}

export default generateUniqueEmployeeId
