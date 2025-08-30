import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiRequest } from '@/lib/api-auth'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    try {
      await validateApiRequest(request, [UserRole.ADMIN, UserRole.MANAGER])
    } catch (err: any) {
      console.error('Supplier create auth error:', err)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const name: string = (body?.name || '').trim()
    const contactName: string | null = (body?.contactName || null)
    const email: string | null = (body?.email || null)
    const phone: string | null = (body?.phone || null)
    const address: string | null = (body?.address || null)

    if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })

    // Prevent duplicates by name
    const existing = await prisma.supplier.findFirst({ where: { name } })
    if (existing) return NextResponse.json({ success: false, error: 'Supplier already exists', supplier: existing })

    const supplier = await prisma.supplier.create({ data: { name, contactName, email, phone, address } })

    return NextResponse.json({ success: true, supplier })
  } catch (error) {
    console.error('Create supplier error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
