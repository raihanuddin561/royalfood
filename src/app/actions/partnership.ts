import { prisma } from '@/lib/prisma'

type PartnerShare = {
  id: string
  name: string
  sharePercent: number
  amount: number
}

// Compute partnership distribution given a distributable amount (retained earnings)
// If partnerId is provided, also return selected partner amount.
export async function getPartnershipDistribution(distributableAmount: number, partnerId?: string) {
  // Fetch only active partners ordered by createdAt (stable order)
  const partners = await prisma.partner.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }
  })

  // If no active partners configured, return default zeroed distribution
  if (!partners || partners.length === 0) {
    return {
      totalDistributable: distributableAmount || 0,
      partners: [] as PartnerShare[],
      selectedPartnerAmount: 0
    }
  }

  // Sum provided percentages (stored as floats like 60.0)
  const totalPercent = partners.reduce((s, p) => s + (p.sharePercent || 0), 0)

  // If totalPercent is 0, fall back to equal split
  const normalized = totalPercent > 0
    ? partners.map(p => ({ ...p, normalizedShare: (p.sharePercent || 0) / totalPercent }))
    : partners.map((p) => ({ ...p, normalizedShare: 1 / partners.length }))

  const partnerShares: PartnerShare[] = normalized.map(p => ({
    id: p.id,
    name: p.name,
    sharePercent: p.sharePercent || (100 / partners.length),
    amount: (distributableAmount || 0) * (p.normalizedShare as number)
  }))

  const selected = partnerId ? partnerShares.find(p => p.id === partnerId) : undefined

  return {
    totalDistributable: distributableAmount || 0,
    partners: partnerShares,
    selectedPartnerAmount: selected ? selected.amount : 0
  }
}
