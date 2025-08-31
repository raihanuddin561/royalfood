import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function normalizeActivePartners(activePartners: Array<any>) {
  if (!activePartners || activePartners.length === 0) return
  const total = activePartners.reduce((s, p) => s + (p.sharePercent || 0), 0)
  if (Math.abs(total - 100) < 0.0001) return // already normalized

  if (total === 0) {
    // evenly distribute
    const per = 100 / activePartners.length
    for (const p of activePartners) {
      await prisma.partner.update({ where: { id: p.id }, data: { sharePercent: per } })
    }
    return
  }

  // scale existing percentages proportionally
  for (const p of activePartners) {
    const normalized = ((p.sharePercent || 0) / total) * 100
    await prisma.partner.update({ where: { id: p.id }, data: { sharePercent: normalized } })
  }
}

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({ orderBy: { createdAt: 'asc' } })
    return NextResponse.json({ success: true, data: partners })
  } catch (error) {
    console.error('GET /api/partners error', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch partners' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, address, sharePercent, isActive } = body
    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'name and email required' }, { status: 400 })
    }

    const sp = typeof sharePercent === 'number' ? sharePercent : parseFloat(String(sharePercent || 0))
    if (isNaN(sp) || sp < 0) {
      return NextResponse.json({ success: false, error: 'sharePercent must be a valid non-negative number' }, { status: 400 })
    }
    // Create partner then normalize active partners to sum to 100%
    const partner = await prisma.partner.create({
      data: { name, email, phone: phone || null, address: address || null, sharePercent: sp, isActive: Boolean(isActive) }
    })

    // Recalculate and normalize active partners
    const activePartners = await prisma.partner.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } })
    await normalizeActivePartners(activePartners)

    const refreshed = await prisma.partner.findUnique({ where: { id: partner.id } })
    return NextResponse.json({ success: true, data: refreshed })
  } catch (error) {
    console.error('POST /api/partners error', error)
    return NextResponse.json({ success: false, error: 'Failed to create partner' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, name, email, phone, address, sharePercent, isActive } = body
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    const data: any = {}
    if (name !== undefined) data.name = name
    if (email !== undefined) data.email = email
    if (phone !== undefined) data.phone = phone
    if (address !== undefined) data.address = address
    if (sharePercent !== undefined) {
      const sp = typeof sharePercent === 'number' ? sharePercent : parseFloat(String(sharePercent))
      if (isNaN(sp) || sp < 0) return NextResponse.json({ success: false, error: 'invalid sharePercent' }, { status: 400 })
      data.sharePercent = sp
    }
    if (isActive !== undefined) data.isActive = Boolean(isActive)

  const partner = await prisma.partner.update({ where: { id }, data })

  // After update, normalize active partners so total sharePercent == 100
  const activePartners = await prisma.partner.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } })
  await normalizeActivePartners(activePartners)

  const refreshed = await prisma.partner.findUnique({ where: { id: partner.id } })
  return NextResponse.json({ success: true, data: refreshed })
  } catch (error) {
    console.error('PATCH /api/partners error', error)
    return NextResponse.json({ success: false, error: 'Failed to update partner' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    await prisma.partner.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/partners error', error)
    return NextResponse.json({ success: false, error: 'Failed to delete partner' }, { status: 500 })
  }
}
