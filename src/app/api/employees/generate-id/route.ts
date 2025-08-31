import { NextResponse } from 'next/server'
import generateUniqueEmployeeId from '@/lib/employeeId'

export async function GET() {
  try {
    const id = await generateUniqueEmployeeId()
    return NextResponse.json({ employeeId: id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
