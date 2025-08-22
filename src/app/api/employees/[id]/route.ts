import { NextRequest, NextResponse } from 'next/server'
import { updateEmployee, deleteEmployee, getEmployeeById, toggleEmployeeStatus } from '@/app/actions/employees'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getEmployeeById(params.id)
    
    if (result.success) {
      return NextResponse.json(result.employee)
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    
    // Convert hireDate string to Date object if provided
    if (body.hireDate) {
      body.hireDate = new Date(body.hireDate)
    }
    
    const result = await updateEmployee(params.id, body)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        employee: result.employee,
        message: 'Employee updated successfully'
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url)
    const softDelete = url.searchParams.get('soft') !== 'false' // Default to soft delete
    
    const result = await deleteEmployee(params.id, softDelete)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
